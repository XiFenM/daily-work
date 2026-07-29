import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(projectRoot, "../..");
const outputPath = resolve(
  repositoryRoot,
  process.argv[2] ??
    "work/algorithm-interview-course/requests/lesson-evidence-response-format.json",
);

const schema = JSON.parse(
  await readFile(
    resolve(projectRoot, "schemas", "lesson-evidence.schema.json"),
    "utf8",
  ),
);
delete schema.$schema;
delete schema.$id;

for (const requiredField of [
  "complexityAnalyses",
  "formulaArtifacts",
  "experiments",
]) {
  if (!schema.required.includes(requiredField)) {
    schema.required.push(requiredField);
  }
}

const inlineProviderSchema = (value, definitions, referenceStack = []) => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      inlineProviderSchema(item, definitions, referenceStack),
    );
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (Array.isArray(value.oneOf)) {
    const nullAlternatives = value.oneOf.filter(
      (alternative) =>
        typeof alternative === "object" &&
        alternative !== null &&
        alternative.type === "null",
    );
    const nonNullAlternatives = value.oneOf.filter(
      (alternative) => !nullAlternatives.includes(alternative),
    );
    if (nullAlternatives.length === 1 && nonNullAlternatives.length === 1) {
      const siblings = Object.fromEntries(
        Object.entries(value).filter(([key]) => key !== "oneOf"),
      );
      const nonNullSchema = inlineProviderSchema(
        nonNullAlternatives[0],
        definitions,
        referenceStack,
      );
      return inlineProviderSchema(
        { ...nonNullSchema, ...siblings, nullable: true },
        definitions,
        referenceStack,
      );
    }
    throw new Error(
      "Provider schema only supports nullable oneOf unions in this workflow.",
    );
  }

  if (typeof value.$ref === "string") {
    const match = value.$ref.match(/^#\/\$defs\/([^/]+)$/);
    if (!match) {
      throw new Error(`Unsupported schema reference: ${value.$ref}`);
    }
    const definitionName = match[1];
    const definition = definitions[definitionName];
    if (!definition) {
      throw new Error(`Missing schema definition: ${definitionName}`);
    }
    if (referenceStack.includes(definitionName)) {
      throw new Error(
        `Circular schema reference: ${[...referenceStack, definitionName].join(
          " -> ",
        )}`,
      );
    }
    const siblings = Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== "$ref"),
    );
    return inlineProviderSchema(
      { ...structuredClone(definition), ...siblings },
      definitions,
      [...referenceStack, definitionName],
    );
  }

  const transformed = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "$defs" || key === "uniqueItems") {
      continue;
    }
    if (key === "const") {
      transformed.enum = [item];
      continue;
    }
    if (key === "type" && Array.isArray(item)) {
      const permitsNull = item.includes("null");
      const nonNullTypes = item.filter((type) => type !== "null");
      if (nonNullTypes.length !== 1) {
        throw new Error(
          `Provider schema cannot preserve the union type ${JSON.stringify(
            item,
          )}; use json_object plus local canonical validation instead.`,
        );
      }
      transformed.type = nonNullTypes[0];
      if (permitsNull) {
        transformed.nullable = true;
      }
      continue;
    }
    transformed[key] = inlineProviderSchema(item, definitions, referenceStack);
  }
  if (
    !transformed.type &&
    Array.isArray(transformed.enum) &&
    transformed.enum.length > 0
  ) {
    const sampleValue = transformed.enum[0];
    transformed.type =
      typeof sampleValue === "number" && Number.isInteger(sampleValue)
        ? "integer"
        : typeof sampleValue;
  }
  return transformed;
};

const providerSchema = inlineProviderSchema(schema, schema.$defs ?? {});

const requestFields = {
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "algorithm_interview_lesson_evidence",
      strict: true,
      schema: providerSchema,
    },
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(requestFields, null, 2)}\n`);
process.stdout.write(`${outputPath}\n`);

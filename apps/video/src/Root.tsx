import { zColor } from "@remotion/zod-types";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Interactive,
  interpolate,
  Series,
  useCurrentFrame,
} from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";

const fps = 30;

export const DailyBriefSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundColor: zColor(),
  primaryColor: zColor(),
  textColor: zColor(),
  footer: z.string(),
  scenes: z
    .array(
      z.object({
        heading: z.string(),
        body: z.string(),
        durationSeconds: z.number().min(1).max(12),
      }),
    )
    .min(1)
    .max(10),
});

export type DailyBriefProps = z.infer<typeof DailyBriefSchema>;

const calculateMetadata: CalculateMetadataFunction<DailyBriefProps> = ({
  props,
}) => ({
  durationInFrames: Math.max(
    1,
    Math.round(
      props.scenes.reduce((total, scene) => total + scene.durationSeconds, 0) *
        fps,
    ),
  ),
  defaultOutName: "daily-brief.mp4",
});

const BriefScene = ({
  heading,
  body,
  sceneDurationInFrames,
  primaryColor,
  textColor,
}: {
  heading: string;
  body: string;
  sceneDurationInFrames: number;
  primaryColor: string;
  textColor: string;
}) => {
  const frame = useCurrentFrame();
  const headingTranslateY = interpolate(frame, [0, 16], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        padding: "180px 88px 220px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 64,
          textAlign: "center",
        }}
      >
        <Interactive.Div
          name="Scene heading"
          style={{
            color: primaryColor,
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: 5,
            textTransform: "uppercase",
            opacity: interpolate(frame, [0, 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            transform: `translateY(${headingTranslateY}px)`,
          }}
        >
          {heading}
        </Interactive.Div>
        <Interactive.Div
          name="Scene body"
          style={{
            color: textColor,
            maxWidth: 900,
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: -3,
            opacity: interpolate(
              frame,
              [8, 26, sceneDurationInFrames - 12, sceneDurationInFrames],
              [0, 1, 1, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              },
            ),
            scale: interpolate(frame, [8, 30], [0.94, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {body}
        </Interactive.Div>
      </div>
    </AbsoluteFill>
  );
};

export const DailyBrief = ({
  title,
  subtitle,
  backgroundColor,
  primaryColor,
  textColor,
  footer,
  scenes,
}: DailyBriefProps) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(circle at 16% 12%, ${primaryColor}33 0, transparent 30%), radial-gradient(circle at 90% 88%, ${primaryColor}22 0, transparent 36%)`,
        fontFamily:
          '"Noto Sans CJK SC", "Noto Sans SC", "Microsoft YaHei", "PingFang SC", Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      <Interactive.Div
        name="Header"
        style={{
          position: "absolute",
          top: 100,
          left: 88,
          right: 88,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          color: textColor,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 30, opacity: 0.64 }}>{subtitle}</div>
      </Interactive.Div>

      <Series>
        {scenes.map((scene, index) => {
          const sceneDurationInFrames = Math.round(scene.durationSeconds * fps);
          return (
            <Series.Sequence
              key={`${scene.heading}-${index}`}
              name={`Scene ${index + 1}: ${scene.heading}`}
              durationInFrames={sceneDurationInFrames}
            >
              <BriefScene
                heading={scene.heading}
                body={scene.body}
                sceneDurationInFrames={sceneDurationInFrames}
                primaryColor={primaryColor}
                textColor={textColor}
              />
            </Series.Sequence>
          );
        })}
      </Series>

      <Interactive.Div
        name="Footer"
        style={{
          position: "absolute",
          left: 88,
          right: 88,
          bottom: 100,
          color: textColor,
          fontSize: 32,
          fontWeight: 700,
          opacity: 0.72,
          textAlign: "center",
        }}
      >
        {footer}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="DailyBrief"
      component={DailyBrief}
      durationInFrames={450}
      fps={fps}
      width={1080}
      height={1920}
      schema={DailyBriefSchema}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        title: "DAILY / AI",
        subtitle: "一个观点，一次看懂",
        backgroundColor: "#07111F",
        primaryColor: "#4ADE80",
        textColor: "#F8FAFC",
        footer: "@your-handle",
        scenes: [
          {
            heading: "今天关注",
            body: "把重复工作交给可验证的自动化",
            durationSeconds: 5,
          },
          {
            heading: "工作方式",
            body: "生成素材，再用代码精确控制成片",
            durationSeconds: 5,
          },
          {
            heading: "行动",
            body: "保留提示词、参数和每一次输出",
            durationSeconds: 5,
          },
        ],
      }}
    />
  );
};

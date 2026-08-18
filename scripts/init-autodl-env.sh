# vscode web
curl -Lk 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64' --output vscode_cli.tar.gz
tar -xf vscode_cli.tar.gz
mkdir -p ~/.local/bin
mv code ~/.local/bin/code

# v2raya
wget -qO - https://apt.v2raya.org/key/public-key.asc | sudo tee /etc/apt/keyrings/v2raya.asc
echo "deb [signed-by=/etc/apt/keyrings/v2raya.asc trusted=true] https://apt.v2raya.org/ v2raya main" | sudo tee /etc/apt/sources.list.d/v2raya.list
apt update
apt install -y v2raya v2ray

# codex
# curl -fsSL https://chatgpt.com/codex/install.sh | sh

# bashrc
# export HTTP_PROXY=http://127.0.0.1:20171
# export HTTPS_PROXY=http://127.0.0.1:20171
# export ALL_PROXY=socks5h://127.0.0.1:20170
# export NO_PROXY=localhost,127.0.0.1,::1

# test network
# curl   --proxy http://127.0.0.1:20171   --connect-timeout 10   --max-time 30   -I https://api.openai.com



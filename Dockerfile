FROM node:22-bookworm-slim

# Installa ffmpeg per la conversione audio e gestione note vocali Telegram
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installa le dipendenze
COPY package*.json ./
RUN npm install --production

# Copia il codice e la knowledge base
COPY . .

# Esponi porta 7860 (standard Hugging Face Spaces)
EXPOSE 7860
ENV PORT=7860

CMD ["node", "bot_node.js"]

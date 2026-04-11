import os
import time
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

# pip install whatsapp-web.py supabase python-dotenv
from whatsapp_web_py import WhatsApp, Message

# ── Configuração ──────────────────────────────────────────────────────────────
load_dotenv()

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["SUPABASE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Handlers ──────────────────────────────────────────────────────────────────

def on_qr(qr: str) -> None:
    """Exibe o QR Code no terminal."""
    import qrcode_terminal
    print("\n📌 ESCANEIE O QR CODE:\n")
    qrcode_terminal.draw(qr, small=True)


def on_ready() -> None:
    print("\n✅ BOT ONLINE!")


def on_message(client: "WhatsApp", message: "Message") -> None:
    # 1. TRAVA DE SEGURANÇA: ignora mensagens próprias
    if message.from_me:
        return

    # 2. FILTRO DE TEXTO
    texto: str = (message.body or "").strip()
    if not texto:
        # Ignora figurinhas, áudios ou avisos sem legenda
        return

    # 3. FILTRO DE GRUPO
    jid: str = message.chat_id  # ex.: "5511999999999@c.us"
    if jid.endswith("@g.us"):
        return

    # 4. FILTRO DE TEMPO (mensagens com mais de 2 min são ignoradas)
    agora = int(time.time())
    tempo_msg = int(message.timestamp)
    if agora - tempo_msg > 120:
        return

    # 5. IDENTIFICAÇÃO
    nome: str = message.sender.push_name or "Usuário Desconhecido"
    numero: str = jid.split("@")[0].split(":")[0]

    print(f'\n📩 Mensagem de {nome} ({numero}): "{texto}"')

    # 6. BANCO DE DADOS
    try:
        response = (
            supabase.table("usuarios")
            .upsert({"numero": numero, "nome": nome}, on_conflict="numero")
            .execute()
        )

        if response.data is not None:
            print("✅ Salvo no Banco.")
            client.send_message(
                jid,
                f"Olá, {nome}! Registrei seu contato ({numero}) no meu banco de dados. 🤖",
            )
        else:
            print("❌ Erro Supabase: resposta vazia.")

    except Exception as e:
        print(f"❌ Erro na lógica: {e}")


# ── Inicialização ─────────────────────────────────────────────────────────────

def iniciar() -> None:
    print("🚀 Iniciando sistema: WhatsApp + Supabase...")

    client = WhatsApp()

    client.on("qr", on_qr)
    client.on("ready", on_ready)
    client.on("message", lambda msg: on_message(client, msg))

    client.initialize()


if __name__ == "__main__":
    iniciar()

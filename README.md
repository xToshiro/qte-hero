# 🎮 QTE Hero — Domine os Reflexos do seu Controle!

<p align="center">
  <img src="https://img.shields.io/badge/Status-100%25%20Offline-green?style=for-the-badge&logo=offline-share" alt="Offline Ready" />
  <img src="https://img.shields.io/badge/Tecnologias-HTML5%20%7C%20CSS3%20%7C%20JS%20Vanilla-blue?style=for-the-badge&logo=javascript" alt="Pure Vanilla" />
  <img src="https://img.shields.io/badge/Suporte-Xbox%20%26%20PlayStation-darkblue?style=for-the-badge&logo=gamepad" alt="Controllers" />
  <img src="https://img.shields.io/badge/Hospedagem-GitHub%20Pages-orange?style=for-the-badge&logo=github" alt="GitHub Pages" />
</p>

O **QTE Hero** é um simulador e treinador web interativo de **Quick Time Events (QTE)**, projetado especialmente para gamers que desejam treinar a memória muscular de seus dedos ao alternar entre controles de consoles diferentes, ou para aqueles que querem refinar seus reflexos para jogos de história e ação intensa (como *God of War*, *Detroit: Become Human*, *Resident Evil*, etc.).

O jogo funciona de forma **100% autônoma, offline-first e privada**, rodando direto no seu navegador sem necessidade de qualquer instalação complexa ou servidores remotos!

---

## ✨ Recursos de Elite (Premium Features)

### 🕹️ Suporte Genérico Multi-Controle com Paleta de Cores Dinâmica
* **Suporte Completo a Xbox & PlayStation:** Escolha no menu inicial entre o **Layout Xbox** (`A`, `B`, `X`, `Y`, `LT`, `RT`, `LB`, `RB`) e o **Layout PlayStation / PS4** (`✕`, `◯`, `⬜`, `△`, `L2`, `R2`, `L1`, `R1`).
* **Adaptação Dinâmica de Interface:** Ao mudar de layout, todo o ecossistema visual se transforma! A paleta de cores geral da interface e os efeitos neons mudam entre o **Verde Xbox** (`#107c11`) e o **Azul PlayStation** (`#0078d4`) com gradientes fúcsia/azul cibernéticos de fundo. O subtítulo do logo também alterna dinamicamente entre **XBOX EDITION** e **PLAYSTATION EDITION**.

### 🎯 Modos de Jogo e Dificuldades Progressivas
* **Modo Treino (Normal):** Jogue sem medo de errar. Ideal para aquecer, acumular combos elevados e treinar sem estresse.
* **Morte Súbita (Hardcore):** Tensão máxima. Um único comando incorreto ou atraso resulta em *Game Over* imediato.
* **4 Níveis de Dificuldade:** Vá de **Recruta** (janela de 2.5s) a **Divino** (extremo, 0.8s) com aceleração rítmica progressiva até o final da rodada de 30 eventos.

### 📊 Painel de Evolução do Jogador e Estatísticas Nerds
* **Métricas Acumuladas:** Acompanhe partidas totais jogadas, seu recorde histórico, taxa de precisão geral de clique e sua reação média histórica em milissegundos.
* **Insights de Performance Inteligentes (IA-Like):** Um sistema analítico local avalia seu progresso no tempo e sugere calibrar seus dedos, aumentar o nível de dificuldade ou comemora se sua reação média das últimas 3 partidas estiver acima do histórico!
* **Gráficos SVG Dinâmicos e Dicas Flutuantes:** Gráficos interativos renderizados em tempo real via JavaScript para analisar sua velocidade de reação e limitação de tempo em cada QTE. Passe o mouse sobre os nós do gráfico para detalhes técnicos!
* **Tabela de Histórico Recente:** Lista detalhada das últimas 5 partidas salvas no navegador.

### 🛠️ Playground de Calibração e Vibração Háptica
* **Diagrama Interativo 2D:** Teste a latência e o mapeamento dos botões em tempo real em um modelo 2D do controle que responde na hora a cada analógico e gatilho pressionado.
* **Teste de Motor Háptico:** Envie pulsos físicos de vibração (`vibrationActuator` Gamepad API) para testar os motores de força do seu controle USB/Bluetooth!

### 🔊 Síntese Sonora e Acessibilidade de Teclado
* **Web Audio API:** Efeitos sonoros gerados por síntese matemática de áudio no lado do cliente (sem carregar arquivos de som externos).
* **Teclado como Fallback:** Sem controle em mãos? Treine perfeitamente no teclado usando mapeamentos intuitivos (`Enter` para A, `Back` para B, `X`, `Y`, `Q`/`E`/`Z`/`C` para gatilhos, e teclas de direção para analógicos).

---

## 🚀 Como Executar e Jogar

### 💻 Método Fácil (Duplo Clique)
1. Baixe o código do projeto.
2. Dê um duplo clique no arquivo **`index.html`** para abrir o QTE Hero em qualquer navegador moderno (Google Chrome, Firefox, Microsoft Edge, Opera, etc.).

### ⚡ Método de Desenvolvimento (Servidor Local)
Se preferir rodar em um servidor web local rápido para desenvolvimento ou testes locais:
```bash
# Instale as dependências leves de servir estáticos
npm install

# Inicie o servidor
npm run dev
```

---

## 🌐 Como Publicar no GitHub Pages (Hospedagem Grátis!)

O QTE Hero foi projetado inteiramente em arquivos de frontend estático, tornando a publicação no **GitHub Pages** rápida e direta.

1. Crie seu repositório no GitHub (ou use o repositório configurado [github.com/xToshiro/qte-hero](https://github.com/xToshiro/qte-hero)).
2. Faça o push dos arquivos do projeto (`index.html`, `style.css`, `game.js`, `gamepad.js`, `sound.js`, `package.json`, `README.md`) para o repositório:
   ```bash
   git init
   git add .
   git commit -m "feat: QTE Hero Multiplataforma Completo"
   git remote add origin https://github.com/xToshiro/qte-hero.git
   git branch -M main
   git push -u origin main
   ```
3. No painel do seu repositório no GitHub:
   * Vá em **Settings** (Configurações) > **Pages** na barra lateral.
   * Na seção **Build and deployment**, sob **Source**, selecione **Deploy from a branch**.
   * Em **Branch**, escolha `main` (ou a branch principal que você usou) e a pasta `/ (root)`.
   * Clique em **Save**.
4. Em instantes, o GitHub gerará um link público para o seu jogo (ex: `https://xToshiro.github.io/qte-hero/`) para você compartilhar com os amigos e treinar seus reflexos onde quiser!

---

## 🔒 Plena Privacidade de Dados
O **QTE Hero** valoriza 100% a sua privacidade:
* **Conectividade Zero:** Nenhum dado sai da sua máquina ou é compartilhado com APIs remotas.
* **Cookies e Web Storage:** Seus dados são gravados localmente apenas se você der consentimento no banner de cookies inicial.
* **Liberdade de Controle:** Você pode exportar seu histórico em um arquivo JSON legível para backup, importar de volta a qualquer momento, ou clicar em **"Limpar Tudo"** para apagar completamente todos os registros do navegador.

---

<p align="center">
  Criado com 💚 e 💙 para aprimorar sua gameplay. Conecte seu controle, configure seus parâmetros de treino e <strong>divirta-se dominando seus reflexos!</strong>
</p>

# 🎮 QTE Hero — Domine os Reflexos do seu Controle!

<p align="center">
  <img src="https://img.shields.io/badge/Status-100%25%20Offline-green?style=for-the-badge&logo=offline-share" alt="Offline Ready" />
  <img src="https://img.shields.io/badge/Tecnologias-HTML5%20%7C%20CSS3%20%7C%20JS%20Vanilla-blue?style=for-the-badge&logo=javascript" alt="Pure Vanilla" />
  <img src="https://img.shields.io/badge/Suporte-Xbox%20%26%20PlayStation-darkblue?style=for-the-badge&logo=gamepad" alt="Controllers" />
  <img src="https://img.shields.io/badge/Hospedagem-GitHub%20Pages-orange?style=for-the-badge&logo=github" alt="GitHub Pages" />
</p>

O **QTE Hero** é um simulador e treinador de **Quick Time Events (QTE)** interativo feito para rodar direto no navegador. Ele foi projetado especialmente para gamers que desejam treinar a memória muscular ao alternar entre controles de consoles diferentes, ou para aqueles que querem refinar seus reflexos e tempo de reação para jogos de história e ação intensa (como *God of War*, *Detroit: Become Human*, *Resident Evil*, etc.).

O jogo funciona de forma **100% autônoma, offline-first e privada**, rodando instantaneamente sem necessidade de downloads ou instalações.

---

## 🕹️ Recursos do Simulador

### Mapeamento de Controles Dinâmico com Paleta Temática
* **Xbox & PlayStation:** Escolha no menu inicial entre o **Layout Xbox** (`A`, `B`, `X`, `Y`, `LT`, `RT`, `LB`, `RB`) e o **Layout PlayStation / PS4** (`✕`, `◯`, `⬜`, `△`, `L2`, `R2`, `L1`, `R1`).
* **Adaptação Visual:** Ao mudar de layout, todo o ecossistema visual se transforma! A paleta de cores geral da interface e os efeitos neons mudam entre o **Verde Xbox** (`#107c11`) e o **Azul PlayStation** (`#0078d4`) com gradientes fúcsia/azul cibernéticos de fundo. O subtítulo do logo também alterna dinamicamente entre **XBOX EDITION** e **PLAYSTATION EDITION**.

### Modos de Jogo e Dificuldades Progressivas
* **Modo Treino (Normal):** Jogue sem medo de errar. Ideal para aquecer, acumular combos elevados e treinar sem pressão de fim de jogo.
* **Morte Súbita (Hardcore):** Tensão máxima. Um único comando incorreto ou atraso resulta em *Game Over* imediato.
* **4 Níveis de Dificuldade:** Vá de **Recruta** (janela de 2.5s) a **Divino** (extremo, 0.8s) com aceleração rítmica progressiva.

### Painel de Evolução do Jogador e Métricas Detalhadas
* **Métricas Acumuladas:** Acompanhe partidas totais jogadas, seu recorde histórico, taxa de precisão geral de clique e sua reação média histórica em milissegundos.
* **Insights de Performance Inteligentes:** Um sistema analítico local avalia seu progresso no tempo e sugere calibrar seus dedos, aumentar o nível de dificuldade ou comemora se sua reação média das últimas partidas estiver acima do histórico!
* **Gráficos SVG Dinâmicos e Dicas Flutuantes:** Gráficos interativos renderizados em tempo real via JavaScript para analisar sua velocidade de reação e limitação de tempo em cada QTE. Passe o mouse sobre os nós do gráfico para detalhes técnicos!
* **Tabela de Histórico Recente:** Lista detalhada das suas últimas 5 partidas salvas no navegador.

### Playground de Calibração e Vibração Háptica
* **Diagrama Interativo 2D:** Teste a latência e o mapeamento dos botões em tempo real em um modelo 2D do controle que responde na hora a cada analógico e gatilho pressionado.
* **Teste de Motor Háptico:** Envie pulsos físicos de vibração (`vibrationActuator` Gamepad API) para testar os motores de força do seu controle USB/Bluetooth!

### Síntese Sonora e Teclado como Fallback
* **Síntese de Som Pura:** Efeitos sonoros gerados por síntese matemática de áudio (Web Audio API) no lado do cliente, sem carregar arquivos de som externos.
* **Fallback por Teclado:** Sem controle em mãos? Treine perfeitamente no teclado usando mapeamentos intuitivos (`Enter` para A, `Back` para B, `X`, `Y`, `Q`/`E`/`Z`/`C` para gatilhos, e teclas de direção para analógicos).

---

## 🚀 Como Jogar

Você pode jogar o QTE Hero de duas maneiras:

1. **Pelo Link Oficial:** Acesse o link público hospedado no **GitHub Pages** (ex: `https://xToshiro.github.io/qte-hero/`).
2. **Execução Local:** Baixe os arquivos do projeto e dê um duplo clique no arquivo **`index.html`** para abrir o jogo instantaneamente em qualquer navegador moderno.

### Passos para iniciar:
1. Conecte seu controle (Xbox, DualShock, DualSense, etc.) ao computador via USB ou Bluetooth.
2. Pressione qualquer botão no controle para que o navegador o detecte.
3. Configure a dificuldade, o modo de jogo e o layout dos botões na tela inicial.
4. Clique em **INICIAR JOGO**, aguarde a contagem regressiva e treine seus reflexos!

---

## 🔒 Plena Privacidade de Dados
O **QTE Hero** valoriza a sua privacidade:
* **Conectividade Zero:** Nenhum dado sai da sua máquina ou é compartilhado com APIs remotas.
* **Cookies e Web Storage:** Seus dados são gravados localmente apenas se você der consentimento no banner de cookies inicial.
* **Liberdade de Controle:** Você pode exportar seu histórico em um arquivo JSON legível para backup, importar de volta a qualquer momento, ou clicar em **"Limpar Tudo"** para apagar completamente todos os registros do navegador.

---

<p align="center">
  Criado para aprimorar sua gameplay. Conecte seu controle, configure seus parâmetros de treino e <strong>divirta-se dominando seus reflexos!</strong>
</p>

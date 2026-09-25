# 25 — Ajuda, Glossário Telecom & Procedimentos Operacionais Padrão (SOP)

## 1. Visão Geral
Documentação operacional integrada à interface do Enlace-CRM (`src/components/AjudaView.tsx`), fornecendo aos colaboradores do provedor capacitação imediata sobre terminologias técnicas, rotinas de atendimento e atalhos de produtividade.

## 2. Glossário de Telecomunicações & GPON
- **FTTH (Fiber to the Home):** Rede de fibra óptica que chega diretamente dentro do imóvel do assinante.
- **OLT (Optical Line Terminal):** Equipamento central do provedor no POP/Data Center que emite os sinais ópticos para a rede externa.
- **ONU / ONT (Optical Network Unit / Terminal):** Equipamento instalado na casa do cliente para converter o sinal óptico em sinal elétrico Ethernet e Wi-Fi.
- **CTO (Caixa de Terminação Óptica):** Caixa localizada no poste na rua onde é feita a sangria do cabo de distribuição e a conexão do cabo drop de atendimento.
- **Atenuação Óptica (dBm):** Perda de potência da luz na fibra. Valores ideais de recepção na ONU: entre `-18 dBm` e `-25 dBm`. Acima de `-27 dBm` caracteriza atenuação crítica.
- **LOS (Loss of Signal):** Alarme óptico indicando ausência total de sinal de luz (fibra rompida, desconectada ou atenuador danificado).
- **PPPoE:** Protocolo de autenticação de banda larga com usuário e senha para liberação de tráfego de internet.

## 3. Procedimentos Operacionais Padrão (SOP)
1. **Atendimento de Lentidão:**
   1. Validar status do contrato e bloqueio comercial.
   2. Realizar diagnóstico de telemetria da ONT (potência RX/TX).
   3. Orientar teste de velocidade via cabo de rede diretamente na porta Gigabit.
   4. Caso atenuação esteja abaixo de `-27 dBm`, abrir Ordem de Serviço de reparo.
2. **Desbloqueio em Confiança (48 Horas):**
   - Permitido para clientes inadimplentes com até 15 dias de vencimento.
   - Válido por 48 horas para realização do pagamento.
   - Limitado a 1 solicitação a cada 30 dias.
   - Registrado de forma imutável na trilha de auditoria do sistema.

## 4. Atalhos de Produtividade na Interface
- `Ctrl + K` / `Cmd + K`: Busca rápida universal de clientes por nome, CPF ou telefone.
- `Alt + N`: Abrir modal de criação de novo lead ou negócio.
- `Alt + P`: Abrir softphone WebPhone SIP para discagem rápida.
- `Alt + M`: Invocar o copiloto de inteligência artificial MaIA.

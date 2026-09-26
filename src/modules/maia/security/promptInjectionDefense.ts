export interface InjectionScanResult {
  isSafe: boolean;
  blocked: boolean;
  detectedPatterns: string[];
  reason?: string;
  sanitizedPrompt: string;
}

// Padrões de ataque clássicos de Direct Prompt Injection, Jailbreak e Delimiter Breakout
const HIGH_SEVERITY_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|prompts|rules)/i,
    description: 'Tentativa de anulação de instruções anteriores (Ignore Instructions)'
  },
  {
    pattern: /system\s+prompt\s+override/i,
    description: 'Tentativa direta de override de prompt do sistema'
  },
  {
    pattern: /disregard\s+(all\s+)?(the\s+)?(rules|instructions|governance|policies)/i,
    description: 'Tentativa de desconsiderar regras de governança'
  },
  {
    pattern: /(you\s+are\s+now\s+in|switch\s+to|activate)\s+(dan|developer|god|jailbreak|unrestricted)\s+mode/i,
    description: 'Tentativa de ativação de modo não-restringido / jailbreak (DAN)'
  },
  {
    pattern: /(reveal|print|output|dump|show)\s+(your|the)\s+(system\s+prompt|initial\s+instructions|secret\s+key|jwt_secret|database_password)/i,
    description: 'Tentativa de exfiltração de segredos ou prompt de sistema'
  },
  {
    pattern: /bypass\s+(all\s+)?(security|policy|governance|rbac|filters|safeguards)/i,
    description: 'Tentativa explícita de evasão de governança / RBAC'
  },
  {
    pattern: /<\/(system_instruction|external_data|catalogo_planos)>/i,
    description: 'Tentativa de quebra de delimitadores XML estruturais (Delimiter Breakout)'
  },
  {
    pattern: /===\s*(system\s+instruction|governance|dados\s+de\s+neg[oó]cio)\s*===/i,
    description: 'Tentativa de falsificação de cabeçalhos de sistema (Header Forgery)'
  }
];

export class PromptInjectionDefense {
  /**
   * Sanitiza a entrada removendo caracteres de controle e normalizando espaços
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    // Remover caracteres de controle ASCII não-imprimíveis (exceto \n, \r, \t)
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  }

  /**
   * Avalia a entrada do usuário contra vetores de ataque conhecidos
   */
  evaluatePrompt(rawPrompt: string): InjectionScanResult {
    const sanitized = this.sanitizeInput(rawPrompt);
    const detectedPatterns: string[] = [];

    for (const item of HIGH_SEVERITY_PATTERNS) {
      if (item.pattern.test(sanitized)) {
        detectedPatterns.push(item.description);
      }
    }

    if (detectedPatterns.length > 0) {
      return {
        isSafe: false,
        blocked: true,
        detectedPatterns,
        reason: `PROMPT_INJECTION_DETECTED: A solicitação contém padrões de violação de governança: ${detectedPatterns.join(', ')}`,
        sanitizedPrompt: sanitized
      };
    }

    return {
      isSafe: true,
      blocked: false,
      detectedPatterns: [],
      sanitizedPrompt: sanitized
    };
  }
}

export const promptInjectionDefense = new PromptInjectionDefense();

import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { parser } from "../core/parser";
import pc from "picocolors";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  gray: "\x1b[90m",
};

export default defineCommand({
  name: "eval",
  description: "Girilen ifadeyi kendi dilinizle ayrıştırır ve sonucu döner",
  options: {
    input: option(z.string(), {
      short: "i",
      description: 'İşlenecek metin (örn: "2 + 3")',
    }),
  },
  handler: ({ flags }) => {
    if (!flags.input) {
      // Hata mesajını kırmızı yap
      console.error(
        pc.red('❌ Lütfen bir metin girin. Örnek: istat eval -i "2 + 3"'),
      );
      process.exit(1);
    }

    try {
      const result = parser.parse(String(flags.input));

      console.log(
        `\n${colors.cyan}${colors.bold}✅ Girdi:${colors.reset} ${colors.gray}${flags.input}${colors.reset}`,
      );
      console.log(
        `${colors.green}${colors.bold}🔍 Sonuç:${colors.reset} ${colors.yellow}${colors.bold}${result}${colors.reset}`,
      );
    } catch (error: any) {
      console.error(
        `\n${colors.red}${colors.bold}❌ Ayrıştırma Hatası:${colors.reset}`,
      );
      console.error(`${colors.red}${error.message}${colors.reset}`);
      process.exit(1);
    }
  },
});

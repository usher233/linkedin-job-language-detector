import { describe, it, expect } from "bun:test";
import { detectLanguage } from "../src/content/detector.js";

describe("Language Detection", () => {
  it("detects English job description", () => {
    const text = "We are looking for a software engineer with experience in React and Node.js. The ideal candidate will have strong problem-solving skills.";
    const result = detectLanguage(text);
    expect(result.primary).toBe("en");
  });

  it("detects Dutch job description", () => {
    const text = "Wij zoeken een ervaren software engineer voor ons team in Amsterdam. Je werkt aan uitdagende projecten.";
    const result = detectLanguage(text);
    expect(result.primary).toBe("nl");
  });

  it("detects German job description", () => {
    const text = "Wir suchen einen erfahrenen Softwareentwickler für unser Team in Berlin. Sie arbeiten an spannenden Projekten.";
    const result = detectLanguage(text);
    expect(result.primary).toBe("de");
  });

  it("returns null for short text", () => {
    const text = "Software engineer";
    const result = detectLanguage(text);
    expect(result.primary).toBeNull();
  });

  it("handles empty text", () => {
    const result = detectLanguage("");
    expect(result.primary).toBeNull();
  });

  it("handles null input", () => {
    const result = detectLanguage(null);
    expect(result.primary).toBeNull();
  });

  it("returns reliability score", () => {
    const text = "Wij zoeken een software engineer met ervaring in JavaScript en TypeScript.";
    const result = detectLanguage(text);
    expect(result.reliable).toBeDefined();
  });

  it("detects French text", () => {
    const text = "Nous recherchons un développeur expérimenté pour notre équipe à Paris. Vous travaillerez sur des projets innovants.";
    const result = detectLanguage(text);
    expect(result.primary).toBe("fr");
  });

  it("detects Spanish text", () => {
    const text = "Buscamos un ingeniero de software experimentado para nuestro equipo en Madrid. Trabajarás en proyectos desafiantes.";
    const result = detectLanguage(text);
    expect(result.primary).toBe("es");
  });

  it("handles error gracefully", () => {
    const result = detectLanguage(null);
    expect(result.error).toBeUndefined();
    expect(result.primary).toBeNull();
  });
});

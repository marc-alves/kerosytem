describe("ambiente de testes", () => {
  it("roda no Node, sem navegador", () => {
    expect(typeof window).toBe("undefined");
  });
});

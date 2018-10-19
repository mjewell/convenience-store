import { add } from "../typedCalculator";

it("adds two numbers together", () => {
  expect(add(1, 2)).toBe(3);
});

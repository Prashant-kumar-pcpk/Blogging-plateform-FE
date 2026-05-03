import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import App from "./App";
import { apiFetch } from "./api/api";

jest.mock("./api/api", () => ({
  apiFetch: jest.fn(),
}));

test("renders platform branding", async () => {
  apiFetch.mockResolvedValue([]);

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  );

  expect((await screen.findAllByText(/InkTrail/i))[0]).toBeInTheDocument();
});

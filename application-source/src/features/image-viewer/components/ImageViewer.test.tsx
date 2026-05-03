import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageViewer } from "./ImageViewer";

const items = [
    { id: "img1", name: "one.jpg", provider: "gdrive" },
    { id: "img2", name: "two.jpg", provider: "gdrive" },
];

describe("ImageViewer", () => {
    it("renders when open and closes on backdrop click", async () => {
        const onClose = vi.fn();
        render(<ImageViewer isOpen items={items} onClose={onClose} token="t" />);

        expect(screen.getByRole("dialog")).toBeDefined();
        fireEvent.click(screen.getByRole("dialog"));
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it("navigates to next image with keyboard", () => {
        render(<ImageViewer isOpen items={items} initialIndex={0} onClose={vi.fn()} token="t" />);

        expect(screen.getByText(/1 \/ 2/)).toBeDefined();
        fireEvent.keyDown(window, { key: "ArrowRight" });
        expect(screen.getByText(/2 \/ 2/)).toBeDefined();
    });

    it("supports zoom controls", () => {
        render(<ImageViewer isOpen items={items} initialIndex={0} onClose={vi.fn()} token="t" />);

        fireEvent.click(screen.getByText("+"));
        fireEvent.click(screen.getByLabelText("Reset transform"));
        fireEvent.click(screen.getByLabelText("Rotate clockwise"));
        expect(screen.getByLabelText("Previous image")).toBeDefined();
    });
});

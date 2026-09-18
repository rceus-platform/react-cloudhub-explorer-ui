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
        fireEvent.click(screen.getByLabelText("Reset to 1x (E or Esc)"));
        fireEvent.click(screen.getByLabelText("Rotate clockwise"));
        expect(screen.getByLabelText("Previous image")).toBeDefined();
    });

    it("supports rotation and reset controls", () => {
        render(<ImageViewer isOpen items={items} initialIndex={0} onClose={vi.fn()} token="t" />);

        const img = screen.getByAltText("one.jpg") as HTMLImageElement;
        expect(img.style.transform).toContain("rotate(0deg)");

        fireEvent.click(screen.getByLabelText("Rotate clockwise"));
        expect(img.style.transform).toContain("rotate(90deg)");

        fireEvent.click(screen.getByLabelText("Rotate clockwise"));
        expect(img.style.transform).toContain("rotate(180deg)");

        fireEvent.click(screen.getByLabelText("Reset to 1x (E or Esc)"));
        expect(img.style.transform).toContain("rotate(0deg)");
        expect(img.style.transform).toContain("scale(1)");
    });

    it("rotates image when pressing r or R", () => {
        render(<ImageViewer isOpen items={items} initialIndex={0} onClose={vi.fn()} token="t" />);

        const img = screen.getByAltText("one.jpg") as HTMLImageElement;
        expect(img.style.transform).toContain("rotate(0deg)");

        fireEvent.keyDown(window, { key: "r" });
        expect(img.style.transform).toContain("rotate(90deg)");

        fireEvent.keyDown(window, { key: "R" });
        expect(img.style.transform).toContain("rotate(180deg)");
    });

    it("zooms in with + and zooms out below 1x with - keys", () => {
        render(<ImageViewer isOpen items={items} initialIndex={0} onClose={vi.fn()} token="t" />);

        const img = screen.getByAltText("one.jpg") as HTMLImageElement;
        expect(img.style.transform).toContain("scale(1)");

        fireEvent.keyDown(window, { key: "+" });
        expect(img.style.transform).toContain("scale(1.25)");

        fireEvent.keyDown(window, { key: "=" });
        expect(img.style.transform).toContain("scale(1.5)");

        fireEvent.keyDown(window, { key: "-" });
        expect(img.style.transform).toContain("scale(1.25)");

        fireEvent.keyDown(window, { key: "_" });
        expect(img.style.transform).toContain("scale(1)");

        // Zoom out below 1x
        fireEvent.keyDown(window, { key: "-" });
        expect(img.style.transform).toContain("scale(0.75)");

        fireEvent.keyDown(window, { key: "-" });
        expect(img.style.transform).toContain("scale(0.5)");
    });

    it("pans with arrow keys when zoomed in or zoomed out instead of navigating", () => {
        render(<ImageViewer isOpen items={items} initialIndex={0} onClose={vi.fn()} token="t" />);

        const img = screen.getByAltText("one.jpg") as HTMLImageElement;
        // Zoom in to 1.5x
        fireEvent.keyDown(window, { key: "+" });
        fireEvent.keyDown(window, { key: "+" });
        expect(img.style.transform).toContain("scale(1.5)");

        // When zoomed in, ArrowRight should pan instead of navigating to next image
        fireEvent.keyDown(window, { key: "ArrowRight" });
        expect(screen.getByText(/1 \/ 2/)).toBeDefined();

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        expect(screen.getByText(/1 \/ 2/)).toBeDefined();

        fireEvent.keyDown(window, { key: "ArrowUp" });
        expect(screen.getByText(/1 \/ 2/)).toBeDefined();

        fireEvent.keyDown(window, { key: "ArrowDown" });
        expect(screen.getByText(/1 \/ 2/)).toBeDefined();

        // Reset with E key
        fireEvent.keyDown(window, { key: "E" });
        expect(img.style.transform).toContain("scale(1)");

        // Zoom out to 0.75x (< 1x)
        fireEvent.keyDown(window, { key: "-" });
        expect(img.style.transform).toContain("scale(0.75)");

        // Arrow keys should pan when < 1x instead of navigating
        fireEvent.keyDown(window, { key: "ArrowRight" });
        expect(screen.getByText(/1 \/ 2/)).toBeDefined();

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        expect(screen.getByText(/1 \/ 2/)).toBeDefined();
    });

    it("resets zoom on first Escape and closes on second Escape", async () => {
        const onClose = vi.fn();
        render(<ImageViewer isOpen items={items} initialIndex={0} onClose={onClose} token="t" />);

        const img = screen.getByAltText("one.jpg") as HTMLImageElement;
        fireEvent.keyDown(window, { key: "+" });
        expect(img.style.transform).toContain("scale(1.25)");

        // First Escape: resets scale to 1x, does not close
        fireEvent.keyDown(window, { key: "Escape" });
        expect(img.style.transform).toContain("scale(1)");
        expect(onClose).not.toHaveBeenCalled();

        // Second Escape: already at 1x, closes viewer
        fireEvent.keyDown(window, { key: "Escape" });
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });
});

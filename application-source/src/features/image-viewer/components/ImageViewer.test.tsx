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

    it("supports rotation and reset controls", () => {
        render(<ImageViewer isOpen items={items} initialIndex={0} onClose={vi.fn()} token="t" />);

        const img = screen.getByAltText("one.jpg") as HTMLImageElement;
        expect(img.style.transform).toContain("rotate(0deg)");

        fireEvent.click(screen.getByLabelText("Rotate clockwise"));
        expect(img.style.transform).toContain("rotate(90deg)");

        fireEvent.click(screen.getByLabelText("Rotate clockwise"));
        expect(img.style.transform).toContain("rotate(180deg)");

        fireEvent.click(screen.getByLabelText("Reset transform"));
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

    it("zooms in with + and zooms out with - keys", () => {
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
    });

    it("pans with arrow keys when zoomed in instead of navigating", () => {
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
    });
});

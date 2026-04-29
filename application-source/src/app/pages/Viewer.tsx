/**
 * Viewer Page Module (Legacy)
 *
 * Responsibilities:
 * - Provide a standalone video viewing page using URL query parameters
 * - Construct direct streaming URLs with optional token authentication
 *
 * Boundaries:
 * - Does not use the theater-style VideoPlayerPage layout
 * - Does not support progress tracking or thumbnails
 */


import { useSearchParams } from "react-router-dom";

export default function Viewer() {
    const [params] = useSearchParams();

    const provider = params.get("provider");
    const fileId = params.get("file_id");
    const fileName = params.get("file_name");

    console.debug("VIEWER PARAMS:", { provider, fileId });

    const token = localStorage.getItem("access_token") ?? "";
    const streamUrl =
        `${import.meta.env.VITE_API_BASE_URL}/files/stream` +
        `?provider=${provider}` +
        `&file_id=${fileId}` +
        `&file_name=${encodeURIComponent(fileName ?? "")}` +
        (token ? `&token=${encodeURIComponent(token)}` : "");

    return (
        <div style={{ padding: "20px" }}>
            <h2>{fileName}</h2>

            <video controls width="800">
                <source src={streamUrl} />
            </video>
        </div>
    );
}
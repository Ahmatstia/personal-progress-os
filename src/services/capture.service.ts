import { createCapture } from "../repositories/today.repository";

export function saveCapture(content: string) { return createCapture(content.trim()); }

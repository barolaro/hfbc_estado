import { manejar } from '../lib/api.js';

// Punto de entrada único de la API. vercel.json reescribe /api/* a /api/v1?r=*.
export default function handler(req, res) {
  return manejar(req, res);
}

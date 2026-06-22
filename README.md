# ⚡ RescueRoute: Intelligent Municipal Dispatch Engine

> **Predictive spatial pathfinding and mid-transit dynamic rerouting built to protect the "Golden Hour" of trauma medicine.**

![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/fastapi-109989?style=for-the-badge&logo=FASTAPI&logoColor=white)

---

## 🛑 The Problem Statement 

In emergency trauma medicine, the **"Golden Hour"** dictates that a critically injured patient's chances of survival drop precipitously if they do not reach an operating table within 60 minutes. 

Standard consumer GPS platforms (Google Maps, Waze) are **purely reactive**. When a first responder encounters an unpredicted municipal hazard—such as a localized flash flood or a fallen power line—the vehicle must come to a complete stop, the driver must physically reverse, call dispatch, and wait for a client-side recalculation. **In an emergency, a 7-minute recalculation window is the difference between life and death.**

## 💡 The Solution

**RescueRoute** transforms municipal dispatch from a *reactive tracking dashboard* into a **proactive, risk-weighted spatial matrix**. By decoupling the client-side view layer from a lightning-fast Python backend running an optimized **A* (A-Star) Spatial Engine**, the system achieves three core enterprise innovations:

1. **Pre-emptive AI Hazard Quarantining:** The algorithm mathematically penalizes vulnerable road segments based on predictive weather triggers *before* a responder gets trapped in them.
2. **Mid-Transit Telemetry Stitching:** If an emergency occurs mid-route, the engine recalculates a localized detour strictly from the vehicle's *active node*, preserving historical breadcrumbs without wiping the operational log.
3. **Directed Heuristic Pathfinding:** Replacing standard 360-degree radial Dijkstra searches with Euclidean-directed vectoring to ensure sub-millisecond graph traversals at city scale.

---

## 🏛️ System Architecture

```text
+-----------------------------------------------------------------+
|                      REACT / VITE FRONTEND                      |
|    (Leaflet DarkMatter + Pure CSS divIcons + Telemetry State)   |
+-----------------------------------------------------------------+
                                 |
           Asynchronous JSON POST (start, end, matrix_flags)
                                 v
+-----------------------------------------------------------------+
|                       FASTAPI REST ROUTER                       |
|   (Uvicorn ASGI -> CORS Middleware -> Pydantic Type Validation) |
+-----------------------------------------------------------------+
                                 |
                 Passes sanitized graph tuple to:
                                 v
+-----------------------------------------------------------------+
|                    A* SPATIAL MATH ENGINE                       |
|  (Heapq Priority Queue -> Euclidean Heuristic -> Path Stitcher) |
+-----------------------------------------------------------------+
import math
import heapq
from typing import List
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="RescueRoute A* Spatial Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared GPS telemetry matrix
NODE_COORDS = {
    'FireStation': (30.9740, 76.5270),
    'A': (30.9760, 76.5280),
    'B': (30.9730, 76.5290),
    'C': (30.9765, 76.5305),
    'D': (30.9745, 76.5315),
    'E': (30.9770, 76.5330),
    'Hospital': (30.9750, 76.5340)
}

base_graph = {
    'FireStation': {'A': 2, 'B': 5},
    'A': {'FireStation': 2, 'C': 2, 'D': 7},
    'B': {'FireStation': 5, 'D': 1},
    'C': {'A': 2, 'D': 1, 'E': 8},
    'D': {'A': 7, 'B': 1, 'C': 1, 'Hospital': 2},
    'E': {'C': 8, 'Hospital': 1},
    'Hospital': {'D': 2, 'E': 1}
}

live_incidents = {}

class RouteRequest(BaseModel):
    start: str
    end: str
    traffic_mode: str = "clear"
    weather_warning: bool = False
    traversed_path: List[str] = []

class IncidentReport(BaseModel):
    node_u: str
    node_v: str
    new_weight: int

def get_effective_weight(u, v, traffic_mode, weather_warning):
    edge_key = tuple(sorted([u, v]))
    if edge_key in live_incidents:
        return live_incidents[edge_key]

    weight = base_graph[u][v]
    if traffic_mode == "rush_hour" and any(node in ['A', 'C', 'D'] for node in [u, v]):
        weight *= 1.8 
    if weather_warning and 'C' in [u, v] and 'D' in [u, v]:
        weight *= 5.0 
    return weight

# THE ARCHITECTURAL FLEX: Pure Euclidean Spatial Heuristic
def heuristic(node: str, goal: str) -> float:
    x1, y1 = NODE_COORDS[node]
    x2, y2 = NODE_COORDS[goal]
    
    raw_euclidean = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    
    # 1000x Scalar aligns coordinate math with our integer minute-weights
    return raw_euclidean * 1000.0

def find_shortest_path_astar(start: str, end: str, traffic_mode: str, weather_warning: bool):
    # Priority Queue stores: (f_score, g_score, node_name, path_history)
    start_h = heuristic(start, end)
    queue = [(start_h, 0, start, [])]
    
    seen = set()
    g_scores = {start: 0}
    
    while queue:
        f_cost, g_cost, node, path = heapq.heappop(queue)
        
        if node in seen:
            continue
        seen.add(node)
        path = path + [node]
        
        if node == end:
            return g_cost, path
            
        for next_node in base_graph.get(node, {}).keys():
            if next_node in seen:
                continue
                
            eff_weight = get_effective_weight(node, next_node, traffic_mode, weather_warning)
            tentative_g = g_cost + eff_weight
            
            if tentative_g < g_scores.get(next_node, float('inf')):
                g_scores[next_node] = tentative_g
                
                # A* Magic: We project the forward-facing cost to target
                h = heuristic(next_node, end)
                f = tentative_g + h
                
                heapq.heappush(queue, (f, tentative_g, next_node, path))
                
    return float("inf"), []

@app.post("/route")
def get_route(req: RouteRequest):
    cost, active_path = find_shortest_path_astar(req.start, req.end, req.traffic_mode, req.weather_warning)
    full_path = req.traversed_path + active_path[1:] if req.traversed_path else active_path
    
    return {
        "path": full_path, 
        "active_detour": active_path,
        "eta_minutes": round(cost, 1),
        "engine": "A* Spatial Search"
    }

@app.post("/update_incident")
def update_incident(req: IncidentReport):
    edge_key = tuple(sorted([req.node_u, req.node_v]))
    if req.new_weight > 1:
        live_incidents[edge_key] = req.new_weight
    else:
        live_incidents.pop(edge_key, None)
    return {"status": "success"}
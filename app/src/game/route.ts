import { shuffleLevels } from './content'
import type { RouteNode, RouteState } from './types'

type Blueprint = Omit<RouteNode, 'level'> & { levelIndex?: number }

const BLUEPRINT: Blueprint[] = [
  { id: 'city', layer: 0, kind: 'start', location: '位面城出口', x: 8, y: 86, next: ['l1-a', 'l1-b'] },
  { id: 'l1-a', layer: 1, kind: 'level', levelIndex: 0, location: '山腰古寺', x: 19, y: 72, next: ['l2-rest-a', 'l2-rest-b'] },
  { id: 'l1-b', layer: 1, kind: 'level', levelIndex: 1, location: '山脚行旅', x: 31, y: 80, next: ['l2-rest-b'] },
  { id: 'l2-rest-a', layer: 2, kind: 'rest', location: '树下歇脚', x: 40, y: 62, next: ['l3-a', 'l3-b'] },
  { id: 'l2-rest-b', layer: 2, kind: 'rest', location: '碑林听风', x: 55, y: 71, next: ['l3-b'] },
  { id: 'l3-a', layer: 3, kind: 'level', levelIndex: 2, location: '大殿', x: 62, y: 45, next: ['l4-a', 'l4-b'] },
  { id: 'l3-b', layer: 3, kind: 'level', levelIndex: 3, location: '树上小庙', x: 72, y: 56, next: ['l4-b'] },
  { id: 'l4-a', layer: 4, kind: 'level', levelIndex: 4, location: '碑林上段', x: 80, y: 30, next: ['summit'] },
  { id: 'l4-b', layer: 4, kind: 'level', levelIndex: 0, location: '两界前殿', x: 88, y: 42, next: ['summit'] },
  { id: 'summit', layer: 5, kind: 'summit', location: '两界交界', x: 93, y: 13, next: [] },
]

export function createRoute(seed: number): RouteState {
  const levels = shuffleLevels(seed)
  const nodes = BLUEPRINT.map(({ levelIndex, ...node }) => ({
    ...node,
    ...(levelIndex === undefined ? {} : { level: levels[levelIndex] }),
  }))
  return { seed, nodes, currentNodeId: 'city', path: ['city'] }
}

export function availableNodeIds(route: RouteState): string[] {
  const current = route.nodes.find((node) => node.id === route.currentNodeId) ?? route.nodes[0]
  return current.next
}

export function completeRouteNode(route: RouteState, nodeId: string): RouteState {
  if (route.currentNodeId === nodeId) return route
  if (!availableNodeIds(route).includes(nodeId)) return route
  return { ...route, currentNodeId: nodeId, path: [...route.path, nodeId] }
}

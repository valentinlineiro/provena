export interface Renderer<TProjection> {
  render(projection: TProjection): string
}

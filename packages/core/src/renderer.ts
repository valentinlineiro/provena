export interface Renderer<TModel> {
  render(model: TModel): string
}

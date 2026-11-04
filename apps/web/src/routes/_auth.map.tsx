import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/map')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/map"!</div>
}

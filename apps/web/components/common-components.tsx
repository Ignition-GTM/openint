import {Auth} from '@supabase/auth-ui-react'

import {EffectContainer, Loading} from '@usevenice/ui'

import {useRouterPlus} from '../contexts/atoms'
import type {LayoutProps} from './Layout'
import {Layout} from './Layout'

export function PageContainer({
  authenticated = true,
  links,
  ...props
}: LayoutProps & {authenticated?: boolean}) {
  // TODO: How do know if Auth.useUser is actually just loading?
  const {user} = Auth.useUser()
  if (authenticated !== undefined && !!user !== authenticated) {
    return <RedirectTo url={authenticated ? '/auth' : '/'} />
  }
  return (
    <Layout
      links={[
        ...(links ?? []),
        ...(user
          ? [
              {label: 'Pipelines', href: '/pipelines'},
              {label: 'Data explorer', href: '/data'},
              {label: 'Profile', href: '/profile'},
            ]
          : []),
      ]}
      {...props}
    />
  )
}

export function RedirectTo(props: {url: string}) {
  const router = useRouterPlus()

  return (
    <EffectContainer effect={() => void router.pushPathname(props.url)}>
      <Loading />
    </EffectContainer>
  )
}

import { apiEndpointTitle, title } from '../../config.js'
import { commonTemplatePageText } from '../components/common-template.js'
import { Link, Redirect } from '../components/router.js'
import { Context, ExpressContext } from '../context.js'
import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { proxy } from '../../../db/proxy.js'
import { eraseUserIdFromCookie, getAuthUserId } from '../auth/user.js'
import Style from '../components/style.js'
import { mapArray } from '../components/fragment.js'
import { filter } from 'better-sqlite3-proxy'
import Time from '../components/time.js'
import { BlogStatus } from './blog.js'

let style = Style(/* css */ `
`)

let ProfilePage = (_attrs: {}, context: Context) => {
  let user_id = getAuthUserId(context)

  return (
    <div id="profile">
      {style}
      <h2>Profile Page</h2>
      <p>{commonTemplatePageText}</p>
      {user_id ? (
        renderProfile(user_id)
      ) : (
        <>
          <p>You are viewing this page as guest.</p>
          <p>
            You can <Link href="/login">login</Link> or{' '}
            <Link href="/register">register</Link> to manage your public profile
            and exclusive content.
          </p>
        </>
      )}
    </div>
  )
}

function renderProfile(user_id: number) {
  let user = proxy.user[user_id]
  let posts = filter(proxy.blog_post, { user_id })
  let post_count = posts.length
  return (
    <>
      <p>Welcome back, {user.username}</p>
      <p>
        <Link href="/blog-post/create">Create Blog Post</Link>
      </p>

      {post_count === 0 ? (
        <p style="font-style:italic">
          You have not created any blog posts yet.
        </p>
      ) : (
        <>
          <p>
            You have created{' '}
            {post_count === 1 ? '1 blog post' : `${post_count} blog posts`}.
          </p>
          <ol>
            {mapArray(posts, post => {
              return (
                <li>
                  <Link href={'/blog-post/' + post.id}>{post.title}</Link> (
                  <BlogStatus post={post} />)
                </li>
              )
            })}
          </ol>
        </>
      )}

      <a href="/logout" rel="nofollow">
        Logout
      </a>
    </>
  )
}

function Logout(_attrs: {}, context: ExpressContext) {
  eraseUserIdFromCookie(context.res)
  return <Redirect href="/login" />
}

export function UserMessageInGuestView(attrs: { user_id: number }) {
  let username = proxy.user[attrs.user_id].username
  return (
    <>
      <p>
        You have login as <b>{username}</b>.
      </p>
      <p>
        You can go to <Link href="/profile">profile page</Link> to manage your
        public profile and exclusive content.
      </p>
    </>
  )
}

let routes: Routes = {
  '/profile': {
    title: title('Profile Page'),
    description: `Manage your public profile and exclusive content`,
    menuText: 'Profile',
    userOnly: true,
    node: <ProfilePage />,
  },
  '/logout': {
    title: apiEndpointTitle,
    description: 'logout your account',
    streaming: false,
    node: <Logout />,
  },
}

export default { routes }

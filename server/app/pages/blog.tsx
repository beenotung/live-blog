import { marked } from 'marked'
import { apiEndpointTitle, title } from '../../config.js'
import { Raw } from '../components/raw.js'
import Style from '../components/style.js'
import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { WsContext } from '../context.js'
import { ServerMessage } from '../../../client/types.js'
import { EarlyTerminate } from '../helpers.js'
import { DynamicContext, getContextFormBody } from '../context.js'
import { BlogPost, proxy } from '../../../db/proxy.js'
import { object, string } from 'cast.ts'
import { Link } from '../components/router.js'
import { getAuthUserId } from '../auth/user.js'
import Time from '../components/time.js'

let createBlogPost = (
  <form
    id="create-blog-post"
    action="/blog-post/create/submit"
    method="post"
    onsubmit="emitForm(event)"
  >
    {Style(/* css */ `
#create-blog-post label {
	display: block;
	margin-top: 0.5rem;
	margin-bottom: 0.25rem;
}
#create-blog-post .input-field {
	padding: 0.5rem;
}
#create-blog-post textarea.input-field {
	font-size: 1em;
	font-family: initial;
}
#blogContentPreview {
}
#create-blog-post .submit-btn {
  margin-top: 0.5rem;
  padding: 0.25rem;
}
`)}
    <h2>Create Blog Post</h2>
    <p>You can create a blog post here.</p>
    <div>
      <label>Blog Post Title</label>
      <input
        class="input-field"
        placeholder="Title of the blog post"
        type="text"
        name="title"
      />
    </div>
    <label>Blog Content</label>
    <div style="display: flex">
      <textarea
        class="input-field"
        name="content"
        oninput="emit('/blog-post/preview',this.value)"
        placeholder="You can write the blog content in markdown format"
      />
      <div>
        <div id="blogContentPreview" class="input-field">
          <div id="blogContentPreviewInner"></div>
          <br />
        </div>
      </div>
    </div>
    <input type="submit" value="Save Blog Post" class="submit-btn" />
  </form>
)

// deepcode ignore ReactIncorrectReturnValue: this is realtime update endpoint
function Preview(_attr: {}, context: WsContext) {
  let content = (context.args?.[0] as string) || ''
  let html = marked(content)
  let message: ServerMessage = [
    'update-in',
    '#blogContentPreviewInner',
    Raw(html),
  ]
  context.ws.send(message)
  throw EarlyTerminate
}

let submitFormParser = object({
  title: string({ trim: true }),
  content: string({ trim: true }),
})

function Create(_attrs: {}, context: DynamicContext) {
  let user_id = getAuthUserId(context)
  if (!user_id) {
    return (
      <div>
        Please login before submitting your blog post.
        <Link href="/login">Login Page</Link>
      </div>
    )
  }
  let input = getContextFormBody(context)
  let body = submitFormParser.parse(input)
  let blog_id = proxy.blog_post.push({
    user_id,
    title: body.title,
    content: body.content,
    create_time: Date.now(),
    publish_time: null,
  })
  return (
    <div>
      <p>Your blog post has been created successfully.</p>
      <Link href={`/blog-post/${blog_id}`}>blog #{blog_id}</Link>
    </div>
  )
}

function BlogPost(attrs: { post: BlogPost }) {
  let { post } = attrs
  return (
    <div>
      <h2>{post.title}</h2>
      <p style="font-style:italic">
        Posted by {post.user?.username}, <BlogStatus post={post} />
      </p>
      {Raw(marked(post.content))}
      <hr />
      <Link href="/profile">Other blog posts</Link>
    </div>
  )
}

export function BlogStatus(attrs: { post: BlogPost }) {
  let { post } = attrs
  let { publish_time, create_time } = post
  if (!create_time) {
    create_time = post.create_time = Date.now()
  }
  return publish_time ? (
    <>
      published since <Time time={publish_time} compact />
    </>
  ) : (
    <>
      drafting since <Time time={create_time} compact />
    </>
  )
}

let routes: Routes = {
  '/blog-post/create': {
    title: title('Create a Blog Post'),
    description: 'Create your next blog post',
    menuText: 'Create Blog Post',
    userOnly: true,
    node: createBlogPost,
  },
  '/blog-post/preview': {
    title: apiEndpointTitle,
    description: 'preview blog content in markdown',
    node: <Preview />,
  },
  '/blog-post/create/submit': {
    title: apiEndpointTitle,
    description: 'submit a new blog post',
    node: <Create />,
  },
  '/blog-post/:id': {
    resolve(context: DynamicContext) {
      let id = context.routerMatch?.params['id']
      let post = proxy.blog_post[id]
      return {
        title: title(post.title),
        description: post.content.split('\n')[0],
        node: <BlogPost post={post} />,
      }
    },
  },
}

export default { routes }

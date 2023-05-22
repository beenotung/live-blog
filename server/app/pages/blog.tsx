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
import { getContextToken } from '../auth/token.js'
import { Link } from '../components/router.js'
import { decodeJwt } from '../jwt.js'

let createBlogPost = (
  <form
    id="create-blog-post"
    action="/blog-post/submit"
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
    <input type="submit" value="Submit" class="submit-btn" />
  </form>
)

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

function Submit(_attrs: {}, context: DynamicContext) {
  let token = getContextToken(context)
  if (!token) {
    return (
      <div>
        Please login before submitting your blog post.
        <Link href="/login">Login Page</Link>
      </div>
    )
  }
  let jwt = decodeJwt(token)
  let input = getContextFormBody(context)
  let body = submitFormParser.parse(input)
  let blog_id = proxy.blog_post.push({
    user_id: jwt.id,
    title: body.title,
    content: body.content,
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
      <p>Posted by {post.user?.username}</p>
      <hr />
      {Raw(marked(post.content))}
      <hr />
      <Link href="/profile">Other blog posts</Link>
    </div>
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
  '/blog-post/submit': {
    title: apiEndpointTitle,
    description: 'submit a new blog post',
    node: <Submit />,
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

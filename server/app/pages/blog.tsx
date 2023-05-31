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
import { markdownToHtml } from '../format/markdown.js'

let createBlogPost = (
  <form
    id="create-blog-post"
    action="/blog-post/create/submit"
    method="post"
    onsubmit="emitForm(event)"
  >
    {Style(/* css */ `
#create-blog-post label {
	display: flex;
	flex-direction: column;
	margin-top: 0.5rem;
}
#create-blog-post label .input-field {
	margin-top: 0.25rem;
	padding: 0.5rem;
}
#create-blog-post textarea.input-field {
	font-size: 1em;
	font-family: initial;
}
#create-blog-post .content-container  {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}
#blogContentPreview {
	margin-top: 0.5rem;
}
#blogContentPreviewInner {
	min-width: 300px;
}
#create-blog-post .submit-btn {
	margin-top: 0.5rem;
	padding: 0.25rem;
}
`)}
    <h2>Create Blog Post</h2>
    <p>You can create a blog post here.</p>
    <label>
      Blog Post Title:
      <input
        class="input-field"
        placeholder="Title of the blog post"
        type="text"
        name="title"
      />
    </label>
    <div class="content-container">
      <label style="flex: 1">
        Blog Content:
        <textarea
          class="input-field"
          style="flex: 1"
          name="content"
          oninput="emit('/blog-post/preview',this.value)"
          placeholder="You can write the blog content in markdown format"
        />
      </label>
      <div id="blogContentPreview" class="input-field" style="flex: 1">
        Preview:
        <div id="blogContentPreviewInner"></div>
      </div>
    </div>
    <input type="submit" value="Save Blog Post" class="submit-btn" />
  </form>
)

// deepcode ignore ReactIncorrectReturnValue: this is realtime update endpoint
function Preview(_attr: {}, context: WsContext) {
  let content = (context.args?.[0] as string) || ''
  let html = markdownToHtml(content)
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

function SubmitCreateBlogPost(_attrs: {}, context: DynamicContext) {
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

function EditBlogPost(attrs: { post: BlogPost }, context: DynamicContext) {
  let { post } = attrs
  return (
    <form
      id="edit-blog-post"
      action={'/blog-post/' + post.id + '/edit/submit'}
      method="post"
      onsubmit="emitForm(event)"
    >
      <h2>Edit Blog Post</h2>
      <div>
        <label>Blog Post Title</label>
        <input
          class="input-field"
          placeholder="Title of the blog post"
          type="text"
          name="title"
        />
      </div>
    </form>
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
      {!post.publish_time ? (
        <div>
          <Link href={'/blog-post/' + post.id + '/edit'}>
            <button>Edit</button>
          </Link>
        </div>
      ) : null}
      {Raw(markdownToHtml(post.content))}
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
    node: <SubmitCreateBlogPost />,
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
  // '/blog-post/:id/edit':{resolve(context: DynamicContext){}}
  // '/blog-post/:id/edit/submit':{resolve(context: DynamicContext){}}
}

export default { routes }

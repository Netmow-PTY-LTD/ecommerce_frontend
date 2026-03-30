<EditorField
                ref={editorRef}
                name="excerpt"
                label="Short Description"
                value={excerpt}
                onChange={setExcerpt}
                placeholder="Brief summary of the blog post"
                height={120}
              />
              <EditorField
                ref={editorRef}
                name="description"
                label="Content"
                value={html}
                onChange={setHtml}
                placeholder="Write your blog content here..."
                height={400}
                required
              />
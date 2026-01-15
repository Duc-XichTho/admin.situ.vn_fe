import Image from '@tiptap/extension-image'
import css from './TipTap.module.css'

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width}px`,
          }
        },
      },
      height: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.height) {
            return {}
          }
          return {
            height: attributes.height,
            style: `height: ${attributes.height}px`,
          }
        },
      },
    }
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div')
      dom.classList.add(css.resizableImageWrapper)

      const img = document.createElement('img')
      img.src = node.attrs.src
      img.alt = node.attrs.alt || ''
      if (node.attrs.width) img.style.width = `${node.attrs.width}px`
      if (node.attrs.height) img.style.height = `${node.attrs.height}px`
      img.classList.add(css.resizableImage)

      dom.appendChild(img)

      const resizeHandles = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']
      resizeHandles.forEach(position => {
        const handle = document.createElement('div')
        handle.classList.add(css.resizeHandle, css[`resize${position}`])

        let startX, startY, startWidth, startHeight

        handle.addEventListener('mousedown', e => {
          e.preventDefault()
          startX = e.clientX
          startY = e.clientY
          startWidth = img.offsetWidth
          startHeight = img.offsetHeight

          const onMouseMove = moveEvent => {
            moveEvent.preventDefault()

            let newWidth = startWidth
            let newHeight = startHeight

            if (position.includes('Right')) {
              newWidth = startWidth + (moveEvent.clientX - startX)
            } else if (position.includes('Left')) {
              newWidth = startWidth - (moveEvent.clientX - startX)
            }

            if (position.includes('Bottom')) {
              newHeight = startHeight + (moveEvent.clientY - startY)
            } else if (position.includes('Top')) {
              newHeight = startHeight - (moveEvent.clientY - startY)
            }

            if (newWidth > 20) {
              img.style.width = `${newWidth}px`
            }

            if (newHeight > 20) {
              img.style.height = `${newHeight}px`
            }
          }

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)

            if (typeof getPos === 'function') {
              editor.view.dispatch(editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
                ...node.attrs,
                width: img.offsetWidth,
                height: img.offsetHeight,
              }))
            }
          }

          document.addEventListener('mousemove', onMouseMove)
          document.addEventListener('mouseup', onMouseUp)
        })

        dom.appendChild(handle)
      })

      return {
        dom,
        update: updatedNode => {
          if (updatedNode.attrs.src !== node.attrs.src) {
            img.src = updatedNode.attrs.src
          }
          if (updatedNode.attrs.width !== node.attrs.width) {
            img.style.width = updatedNode.attrs.width ? `${updatedNode.attrs.width}px` : null
          }
          if (updatedNode.attrs.height !== node.attrs.height) {
            img.style.height = updatedNode.attrs.height ? `${updatedNode.attrs.height}px` : null
          }
          return true
        },
      }
    }
  },
})
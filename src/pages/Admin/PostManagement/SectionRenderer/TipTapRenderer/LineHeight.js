import { Extension } from '@tiptap/core'

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
      defaultHeight: 'normal',
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: 'normal',
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {}
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              }
            },
            parseHTML: element => element.style.lineHeight || 'normal',
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight) => ({ commands }) => {
        return this.options.types.every(type => 
          commands.updateAttributes(type, { lineHeight })
        )
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types.every(type => 
          commands.resetAttributes(type, ['lineHeight'])
        )
      },
    }
  },
})
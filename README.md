# NFT Direct HTML Editor

A modern, feature-rich HTML editor built with Next.js that provides a seamless experience for editing and previewing HTML content.

## Features

### Rich Text Editing
- Full text formatting capabilities (bold, italic, underline)
- Multiple heading levels (H1, H2, H3)
- Text alignment options (left, center, right)
- Nested list support with multiple styles:
  - Ordered lists (numbers, letters, roman numerals)
  - Unordered lists (bullet points)
  - List indentation control

### Table Management
- Insert and delete tables
- Add/remove rows and columns
- Merge and split cells
- Cell formatting and alignment
- Fixed-width table support

### Special Features
- BE Variable Support (`%s` displayed as `{BE VARIABLE}` in edit mode)
- HTML minification on export
- Copy minified HTML to clipboard
- Preview/Edit mode toggle
- File upload and export functionality

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the editor.

## Usage

1. **Upload HTML**: Click the "Upload HTML" button to load an existing HTML file
2. **Edit Content**: 
   - Use the toolbar for text formatting
   - Insert tables and manage their structure
   - Add BE Variables where needed
3. **Preview**: Toggle between edit and preview modes to see the final output
4. **Export/Copy**: 
   - Use the "Export" button to download the HTML file
   - Use the "Copy" button to copy minified HTML to clipboard

## Technical Details

This project uses:
- [`Next.js`](https://nextjs.org/) - React framework
- [`TipTap`](https://tiptap.dev/) - Headless editor framework
- [`Tailwind CSS`](https://tailwindcss.com/) - Styling
- Modern browser APIs for file handling and clipboard operations

## Development

The editor is built with modern web technologies and follows best practices for:
- Responsive design
- Keyboard accessibility
- Clean and minified HTML output
- Consistent styling across different browsers

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

This project is deployed and live at [https://direct-html-editor.vercel.app](https://direct-html-editor.vercel.app).

The deployment is handled through the [Vercel Platform](https://vercel.com) from the creators of Next.js. If you want to deploy your own instance, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

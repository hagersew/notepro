import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { AppShell } from '../ui/AnnotationsApp'
import { noteproTheme } from '../ui/theme'

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <>
        <ColorModeScript initialColorMode={noteproTheme.config.initialColorMode} />
        <ChakraProvider theme={noteproTheme}>
          <AppShell variant="sidepanel" />
        </ChakraProvider>
      </>
    </React.StrictMode>,
  )
}

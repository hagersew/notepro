import { extendTheme, type StyleFunctionProps, type ThemeConfig } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: true,
}

export const noteproTheme = extendTheme({
  config,
  fonts: {
    heading:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    body: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.9375rem',
  },
  radii: {
    xl: '1rem',
    '2xl': '1.25rem',
  },
  shadows: {
    noteproElevated: '0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 12px 24px -8px rgba(0, 0, 0, 0.55)',
    noteproInner: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  },
  colors: {
    notepro: {
      muted: '#64748b',
    },
  },
  semanticTokens: {
    colors: {
      'notepro.canvas': {
        default: 'gray.50',
        _dark: '#0c0e14',
      },
      'notepro.surface': {
        default: 'white',
        _dark: '#13151f',
      },
      'notepro.raised': {
        default: 'gray.100',
        _dark: '#1a1d2e',
      },
      'notepro.text': {
        default: 'gray.800',
        _dark: 'gray.100',
      },
      'notepro.textMuted': {
        default: 'gray.600',
        _dark: 'gray.500',
      },
      'notepro.border': {
        default: 'blackAlpha.200',
        _dark: 'whiteAlpha.200',
      },
      'notepro.borderSoft': {
        default: 'blackAlpha.100',
        _dark: 'whiteAlpha.100',
      },
      'notepro.cardBg': {
        default: 'blackAlpha.50',
        _dark: 'blackAlpha.400',
      },
      'notepro.highlightTitle': {
        default: 'gray.800',
        _dark: 'gray.100',
      },
      'notepro.highlightNote': {
        default: 'gray.700',
        _dark: 'gray.200',
      },
      'notepro.highlightQuote': {
        default: 'gray.700',
        _dark: 'gray.300',
      },
      'notepro.link': {
        default: 'blue.600',
        _dark: 'indigo.300',
      },
    },
  },
  styles: {
    global: {
      'html, body, #root': {
        minHeight: '100%',
      },
      body: {
        bg: 'notepro.canvas',
        backgroundImage: {
          base: 'radial-gradient(ellipse 120% 90% at 50% -25%, rgba(99, 102, 241, 0.08), transparent 52%), radial-gradient(ellipse 85% 55% at 100% 0%, rgba(168, 85, 247, 0.06), transparent 48%), radial-gradient(ellipse 70% 45% at 0% 100%, rgba(59, 130, 246, 0.05), transparent 50%)',
          _dark:
            'radial-gradient(ellipse 120% 90% at 50% -25%, rgba(99, 102, 241, 0.22), transparent 52%), radial-gradient(ellipse 85% 55% at 100% 0%, rgba(168, 85, 247, 0.12), transparent 48%), radial-gradient(ellipse 70% 45% at 0% 100%, rgba(59, 130, 246, 0.08), transparent 50%)',
        },
        color: 'notepro.text',
      },
      '*::placeholder': {
        color: 'gray.500',
      },
      '*::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '*::-webkit-scrollbar-thumb': {
        background: 'whiteAlpha.200',
        borderRadius: 'full',
      },
      '*::-webkit-scrollbar-track': {
        background: 'transparent',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
      },
      variants: {
        brand: {
          bgGradient: 'linear(to-r, indigo.500, purple.500)',
          color: 'white',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
          _hover: {
            bgGradient: 'linear(to-r, indigo.400, purple.400)',
            _disabled: {
              bgGradient: 'linear(to-r, indigo.500, purple.500)',
            },
          },
          _active: {
            bgGradient: 'linear(to-r, indigo.600, purple.600)',
          },
        },
        surface: {
          bg: 'notepro.raised',
          color: 'notepro.text',
          borderWidth: '1px',
          borderColor: 'notepro.border',
          _hover: {
            bg: 'notepro.surface',
            borderColor: 'notepro.border',
          },
        },
      },
    },
    Input: {
      variants: {
        notepro: {
          field: (props: StyleFunctionProps) => ({
            bg: 'notepro.raised',
            borderColor: 'notepro.border',
            borderRadius: 'lg',
            color: 'notepro.text',
            _hover: { borderColor: mode('blackAlpha.300', 'whiteAlpha.300')(props) },
            _focusVisible: {
              borderColor: 'indigo.400',
              boxShadow: '0 0 0 1px rgba(129, 140, 248, 0.8)',
            },
          }),
        },
      },
      defaultProps: {
        variant: 'notepro',
        size: 'sm',
      },
    },
    Select: {
      variants: {
        notepro: {
          field: (props: StyleFunctionProps) => ({
            bg: 'notepro.raised',
            borderColor: 'notepro.border',
            borderRadius: 'lg',
            color: 'notepro.text',
            _hover: { borderColor: mode('blackAlpha.300', 'whiteAlpha.300')(props) },
            _focusVisible: {
              borderColor: 'indigo.400',
              boxShadow: '0 0 0 1px rgba(129, 140, 248, 0.8)',
            },
          }),
        },
      },
      defaultProps: {
        variant: 'notepro',
        size: 'sm',
      },
    },
    Textarea: {
      variants: {
        notepro: {
          field: (props: StyleFunctionProps) => ({
            bg: 'notepro.raised',
            borderColor: 'notepro.border',
            borderRadius: 'lg',
            color: 'notepro.text',
            _hover: { borderColor: mode('blackAlpha.300', 'whiteAlpha.300')(props) },
            _focusVisible: {
              borderColor: 'indigo.400',
              boxShadow: '0 0 0 1px rgba(129, 140, 248, 0.8)',
            },
          }),
        },
      },
      defaultProps: {
        variant: 'notepro',
        size: 'sm',
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 2,
        py: 0.5,
        fontWeight: 'medium',
      },
    },
    Modal: {
      baseStyle: (props: StyleFunctionProps) => ({
        overlay: {
          bg: mode('blackAlpha.500', 'blackAlpha.700')(props),
          backdropFilter: 'blur(6px)',
        },
        dialog: {
          borderRadius: '2xl',
          bg: 'notepro.surface',
          borderWidth: '1px',
          borderColor: 'notepro.border',
          boxShadow: 'noteproElevated',
        },
        header: {
          borderBottomWidth: '1px',
          borderColor: 'notepro.borderSoft',
          py: 4,
        },
        footer: {
          borderTopWidth: '1px',
          borderColor: 'notepro.borderSoft',
          gap: 2,
        },
      }),
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'notepro.surface',
          borderWidth: '1px',
          borderColor: 'notepro.border',
          borderRadius: 'xl',
          boxShadow: 'noteproElevated',
        },
      },
    },
  },
})

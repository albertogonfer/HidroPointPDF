import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserWarning } from '@/adapters/pdf-renaming/components/BrowserWarning'

describe('BrowserWarning', () => {
  describe('when FSAA is not supported', () => {
    beforeEach(() => {
      // Remove showDirectoryPicker from window to simulate unsupported browser
      vi.stubGlobal('showDirectoryPicker', undefined)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('renders a warning banner', () => {
      render(<BrowserWarning fsaaSupported={false} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('mentions Chromium browser requirement', () => {
      render(<BrowserWarning fsaaSupported={false} />)
      expect(screen.getByRole('alert')).toHaveTextContent(/chromium/i)
    })

    it('blocks write operations by showing the banner prominently', () => {
      render(<BrowserWarning fsaaSupported={false} />)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('when FSAA is supported', () => {
    it('renders nothing', () => {
      const { container } = render(<BrowserWarning fsaaSupported={true} />)
      expect(container.firstChild).toBeNull()
    })
  })
})

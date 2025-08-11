import { initData, init } from '@telegram-apps/sdk'
import { TelegramUser } from '@/types'

export class TelegramService {
  private static instance: TelegramService
  private initialized = false

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService()
    }
    return TelegramService.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize Telegram Mini App
      init()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize Telegram SDK:', error)
      throw error
    }
  }

  getTelegramUser(): TelegramUser | null {
    try {
      if (!this.initialized) return null
      
      const data = initData()
      if (!data?.user) return null

      return {
        id: data.user.id,
        first_name: data.user.firstName,
        last_name: data.user.lastName,
        username: data.user.username,
        language_code: data.user.languageCode,
        is_premium: data.user.isPremium
      }
    } catch (error) {
      console.error('Failed to get Telegram user:', error)
      return null
    }
  }

  isInTelegram(): boolean {
    return typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined
  }

  expandWebApp(): void {
    if (this.isInTelegram()) {
      window.Telegram.WebApp.expand()
    }
  }

  showAlert(message: string): void {
    if (this.isInTelegram()) {
      window.Telegram.WebApp.showAlert(message)
    } else {
      alert(message)
    }
  }

  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isInTelegram()) {
        window.Telegram.WebApp.showConfirm(message, resolve)
      } else {
        resolve(confirm(message))
      }
    })
  }

  hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (this.isInTelegram() && window.Telegram.WebApp.HapticFeedback) {
      switch (type) {
        case 'light':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
          break
        case 'medium':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
          break
        case 'heavy':
          window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy')
          break
      }
    }
  }

  shareReferralLink(referralCode: string): void {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'
    const shareUrl = `${appUrl}?ref=${referralCode}`
    const shareText = `🎉 Join me on this amazing TRX earning app! Use my referral link to get started: ${shareUrl}`
    
    if (this.isInTelegram()) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)
    } else {
      navigator.share?.({
        title: 'TRX Earning App',
        text: shareText,
        url: shareUrl
      }).catch(() => {
        navigator.clipboard?.writeText(shareUrl)
      })
    }
  }
}

// Global Telegram WebApp type declaration
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: any
        version: string
        platform: string
        colorScheme: 'light' | 'dark'
        themeParams: any
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        isClosingConfirmationEnabled: boolean
        expand(): void
        close(): void
        ready(): void
        showAlert(message: string): void
        showConfirm(message: string, callback: (confirmed: boolean) => void): void
        showPopup(params: any, callback?: (buttonId: string) => void): void
        openLink(url: string): void
        openTelegramLink(url: string): void
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy'): void
          notificationOccurred(type: 'error' | 'success' | 'warning'): void
          selectionChanged(): void
        }
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText(text: string): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
          show(): void
          hide(): void
          enable(): void
          disable(): void
          showProgress(leaveActive?: boolean): void
          hideProgress(): void
          setParams(params: any): void
        }
        BackButton: {
          isVisible: boolean
          onClick(callback: () => void): void
          offClick(callback: () => void): void
          show(): void
          hide(): void
        }
      }
    }
  }
}

export const telegram = TelegramService.getInstance()
class SoundEffectPlayer {
  private static instance: SoundEffectPlayer;
  private sentSound: HTMLAudioElement | null = null;
  private receivedSound: HTMLAudioElement | null = null;
  private unreadSound: HTMLAudioElement | null = null;
  private reactionSound: HTMLAudioElement | null = null;
  private enabled: boolean = true;
  private isMobile: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Check if device is mobile
      this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Get sound preference from localStorage, default to !isMobile if not set
      const storedEnabled = localStorage.getItem('soundEnabled');
      this.enabled = storedEnabled !== null ? storedEnabled === 'true' : !this.isMobile;
      
      this.sentSound = new Audio('/messages/sound-effects/sent.m4a');
      this.receivedSound = new Audio('/messages/sound-effects/received.m4a');
      this.unreadSound = new Audio('/messages/sound-effects/unread.m4a');
      this.reactionSound = new Audio('/messages/sound-effects/reaction.m4a');
    }
  }

  public static getInstance(): SoundEffectPlayer {
    if (!SoundEffectPlayer.instance) {
      SoundEffectPlayer.instance = new SoundEffectPlayer();
    }
    return SoundEffectPlayer.instance;
  }

  public playSentSound() {
    if (this.enabled && typeof window !== 'undefined' && this.sentSound) {
      this.sentSound.currentTime = 0;
      this.sentSound.play().catch(() => {
        // Silently handle autoplay restrictions
      });
    }
  }

  public playUnreadSound() {
    if (this.enabled && typeof window !== 'undefined' && this.unreadSound) {
      this.unreadSound.currentTime = 0;
      this.unreadSound.play().catch(() => {
        // Silently handle autoplay restrictions
      });
    }
  }

  public playReceivedSound() {
    if (this.enabled && typeof window !== 'undefined' && this.receivedSound) {
      this.receivedSound.currentTime = 0;
      this.receivedSound.play().catch(() => {
        // Silently handle autoplay restrictions
      });
    }
  }

  public playReactionSound() {
    if (this.enabled && typeof window !== 'undefined' && this.reactionSound) {
      this.reactionSound.currentTime = 0;
      this.reactionSound.play().catch(() => {
        // Silently handle autoplay restrictions
      });
    }
  }

  public toggleSound() {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', this.enabled.toString());
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundEffects = SoundEffectPlayer.getInstance();

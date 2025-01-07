class SoundEffectPlayer {
  private static instance: SoundEffectPlayer;
  private sentSound: HTMLAudioElement | null = null;
  private receivedSound: HTMLAudioElement | null = null;
  private unreadSound: HTMLAudioElement | null = null;
  private reactionSound: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.sentSound = new Audio('/sound-effects/sent.m4a');
      this.receivedSound = new Audio('/sound-effects/received-in-chat.m4a');
      this.unreadSound = new Audio('/sound-effects/received.m4a');
      this.reactionSound = new Audio('/sound-effects/reaction.m4a');
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

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundEffects = SoundEffectPlayer.getInstance();

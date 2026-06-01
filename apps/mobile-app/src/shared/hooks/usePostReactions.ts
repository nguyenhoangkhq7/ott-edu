import { useCallback, useState } from 'react';
import { apiClient } from '@/modules/api';

/**
 * Reaction Types supported by the backend
 */
export const REACTION_TYPES = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
}

export const REACTION_EMOJIS: Record<ReactionType, ReactionConfig> = {
  LIKE: { type: 'LIKE', emoji: '👍', label: 'Like' },
  LOVE: { type: 'LOVE', emoji: '❤️', label: 'Love' },
  HAHA: { type: 'HAHA', emoji: '😂', label: 'Haha' },
  WOW: { type: 'WOW', emoji: '😮', label: 'Wow' },
  SAD: { type: 'SAD', emoji: '😢', label: 'Sad' },
  ANGRY: { type: 'ANGRY', emoji: '😡', label: 'Angry' },
};

export type TargetType = 'POST' | 'COMMENT';

export interface ReactionUpdateParams {
  targetId: string;
  targetType: TargetType;
  reactionType: ReactionType;
}

/**
 * Hook: usePostReactions
 * Manages toggling reactions on posts and comments
 * Provides optimistic updates and error handling
 */
export function usePostReactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Toggle a reaction on a post or comment
   * If user already has this reaction, it will be removed
   * If user has a different reaction, it will be changed
   *
   * @param params - Parameters including targetId, targetType, and reactionType
   * @returns Promise resolving to true if successful, false otherwise
   */
  const toggleReaction = useCallback(
    async (params: ReactionUpdateParams): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams({
          targetId: params.targetId,
          targetType: params.targetType,
          reactionType: params.reactionType,
        });

        await apiClient.post(
          `/interact/reactions?${queryParams.toString()}`,
          {}
        );

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update reaction';
        setError(errorMessage);
        console.error('[usePostReactions] Toggle error:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get emoji for a specific reaction type
   */
  const getReactionEmoji = useCallback((reactionType: ReactionType | null | undefined): string => {
    if (!reactionType || !REACTION_EMOJIS[reactionType]) {
      return '👍';
    }
    return REACTION_EMOJIS[reactionType].emoji;
  }, []);

  /**
   * Get label for a specific reaction type
   */
  const getReactionLabel = useCallback((reactionType: ReactionType | null | undefined): string => {
    if (!reactionType || !REACTION_EMOJIS[reactionType]) {
      return 'Like';
    }
    return REACTION_EMOJIS[reactionType].label;
  }, []);

  /**
   * Get all available reactions with their configs
   */
  const getAllReactions = useCallback((): ReactionConfig[] => {
    return Object.values(REACTION_EMOJIS);
  }, []);

  return {
    toggleReaction,
    getReactionEmoji,
    getReactionLabel,
    getAllReactions,
    loading,
    error,
  };
}

/**
 * Utility function to determine if user's reaction should toggle or change
 * Used by UI components to provide feedback
 *
 * @param currentUserReaction - The current reaction of the user (if any)
 * @param selectedReaction - The reaction type being selected
 * @returns 'add' | 'remove' | 'change'
 */
export function getReactionAction(
  currentUserReaction: ReactionType | null | undefined,
  selectedReaction: ReactionType
): 'add' | 'remove' | 'change' {
  if (!currentUserReaction) {
    return 'add';
  }
  if (currentUserReaction === selectedReaction) {
    return 'remove';
  }
  return 'change';
}

/**
 * Utility function to calculate new reaction count after toggle
 * Used for optimistic UI updates
 *
 * @param currentCount - Current reaction count
 * @param currentUserReaction - User's current reaction (if any)
 * @param selectedReaction - The reaction being toggled
 * @returns New reaction count
 */
export function calculateNewReactionCount(
  currentCount: number,
  currentUserReaction: ReactionType | null | undefined,
  selectedReaction: ReactionType
): number {
  const action = getReactionAction(currentUserReaction, selectedReaction);

  switch (action) {
    case 'add':
      return currentCount + 1;
    case 'remove':
      return Math.max(0, currentCount - 1);
    case 'change':
      // Count stays the same, just reaction type changes
      return currentCount;
    default:
      return currentCount;
  }
}

import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfilePostGrid } from '../../components/profile/ProfilePostGrid';
import { UserListModal } from '../../components/profile/UserListModal';
import { NBButton, NBEmptyState } from '../../components/ui';
import { useCurrentUser } from '../../hooks/useAuth';
import {
  FollowListType,
  useFollowMutation,
  useProfileStats,
  useUserPosts,
  useUserProfile,
} from '../../hooks/useProfile';
import { colors } from '../../lib/theme';

export default function PublicProfileScreen() {
  const params = useLocalSearchParams<{ username: string }>();
  const username = params.username;
  const me = useCurrentUser();
  const isOwnProfile = !!me && me.username === username;

  // Viewing your own profile from a public link → bounce to the profile tab.
  useEffect(() => {
    if (isOwnProfile) {
      router.replace('/(tabs)/profile');
    }
  }, [isOwnProfile]);

  const { data: profile, isLoading, isError } = useUserProfile(username);
  const { data: stats } = useProfileStats(username);
  const { data: posts, isLoading: postsLoading } = useUserPosts(username);
  const follow = useFollowMutation(username);

  const [listType, setListType] = useState<FollowListType | null>(null);

  if (isOwnProfile) return null;

  if (isLoading || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.offwhite, alignItems: 'center', justifyContent: 'center' }}>
        {isError ? (
          <NBEmptyState title="User not found" body="This profile doesn't exist or is unavailable" cta="Go back" onCta={() => router.back()} />
        ) : (
          <ActivityIndicator color={colors.black} size="large" />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.offwhite }}>
      <ProfileHeader
        user={profile}
        onBack={() => router.back()}
        onFollowersPress={() => setListType('followers')}
        onFollowingPress={() => setListType('following')}
        actionSlot={
          <NBButton
            label={profile.isFollowing ? 'Unfollow' : 'Follow'}
            variant={profile.isFollowing ? 'secondary' : 'primary'}
            fullWidth
            loading={follow.isPending}
            onPress={() => follow.mutate(!!profile.isFollowing)}
          />
        }
      />

      <ProfilePostGrid
        posts={posts ?? []}
        stats={stats}
        loading={postsLoading}
        emptyTitle="No posts yet"
        emptyBody={`@${profile.username} hasn't posted any outfits`}
      />

      <UserListModal
        visible={listType !== null}
        username={username}
        type={listType ?? 'followers'}
        onClose={() => setListType(null)}
      />
    </View>
  );
}

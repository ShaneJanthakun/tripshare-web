import type { getTranslations } from 'next-intl/server';
import type { CommentLabels } from './Comments';

type T = Awaited<ReturnType<typeof getTranslations>>;

/** The comment section's texts, from the app's own (app.guideDetail, app.common) and social.*. */
export function commentLabels(t: T): CommentLabels {
  return {
    title: t('app.guideDetail.comments'), signInToRead: t('social.signInToRead'), signIn: t('app.common.signIn'),
    loading: t('app.common.loading'), placeholder: t('app.guideDetail.addComment'), post: t('app.guideDetail.postComment'),
    none: t('app.guideDetail.noComments'), noneSub: t('app.guideDetail.noCommentsSub'), already: t('app.guideDetail.alreadyCommented'),
    edit: t('app.guideDetail.editComment'), del: t('app.common.delete'), deleteConfirm: t('app.guideDetail.deleteCommentConfirm'),
    save: t('app.common.save'), cancel: t('app.common.cancel'), moderate: t('app.guideDetail.moderate'),
    deleteAction: t('app.guideDetail.deleteCommentAction'), blockTitle: t.raw('app.guideDetail.blockUserTitle') as string,
    blockConfirm: t('app.guideDetail.blockUserConfirm'), failed: t('app.guideDetail.commentFailed'), editFailed: t('app.guideDetail.commentEditFailed'),
  };
}

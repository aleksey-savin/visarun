import React, { useState } from 'react';
import { Send, /** Edit2, Trash2, FileText, **/ User, Calendar } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/** import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'; **/

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';

import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface CommentsProps {
  orderId?: string;
  clientId?: string;
  orderItemId?: string;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

interface Comment {
  id: string;
  content: string;
  documentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  client?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  order?: {
    id: string;
    status: string;
  } | null;
  orderItem?: {
    id: string;
    serviceType: string;
  } | null;
}

const Comments: React.FC<CommentsProps> = ({
  orderId,
  clientId,
  orderItemId,
  isExpanded = false,
  onToggle,
}) => {
  const [showComments, setShowComments] = useState(isExpanded);
  const [newComment, setNewComment] = useState('');
  // const [editingComment, setEditingComment] = useState<string | null>(null);
  // const [editContent, setEditContent] = useState('');
  // const [documentUrl, setDocumentUrl] = useState('');

  const authedUserId = useAuth().user?.id;

  // TRPC queries and mutations
  const { data: commentsData, refetch } = trpc.comment.getAll.useQuery(
    {
      orderId,
      clientId,
      orderItemId,
      limit: 50,
    },
    {
      enabled: !!orderId || !!clientId || !!orderItemId,
    }
  );

  const createCommentMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      toast.success('Comment added successfully');
      setNewComment('');
      // setDocumentUrl('');
      refetch();
    },
    onError: error => {
      toast.error(error.message || 'Failed to add comment');
    },
  });

  /* const editCommentMutation = trpc.comment.edit.useMutation({
    onSuccess: () => {
      toast.success('Comment updated successfully');
      setEditingComment(null);
      setEditContent('');
      refetch();
    },
    onError: error => {
      toast.error(error.message || 'Failed to update comment');
    },
  }); */

  const handleToggle = (checked: boolean) => {
    setShowComments(checked);
    onToggle?.(checked);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      orderId: orderId || undefined,
      clientId: clientId || undefined,
      orderItemId: orderItemId || undefined,
      content: newComment.trim(),
      // documentUrl: documentUrl.trim() || undefined,
    });
  };

  /**const deleteCommentMutation = trpc.comment.delete.useMutation({
    onSuccess: () => {
      toast.success('Comment deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
  **/

  /** const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;

    editCommentMutation.mutate({
      id: commentId,
      content: editContent.trim(),
    });
  }; **/

  /** const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate({ id: commentId });
  }; **/

  const formatUserName = (user: Comment['user']) => {
    if (!user) return 'Unknown User';
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User';
  };

  const comments = commentsData?.comments || [];
  const commentCount = comments.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={showComments} onCheckedChange={handleToggle} />
          <Label className="flex items-center gap-2 cursor-pointer">
            Comments
            {commentCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {commentCount}
              </Badge>
            )}
          </Label>
        </div>
      </div>

      {showComments && (
        <>
          {comments.length > 0 && (
            <>
              {/* Comments list */}
              <div className="space-y-4">
                {comments.map(comment => (
                  <Card
                    key={comment.id}
                    className={cn(
                      'p-2 rounded-md border-none',
                      comment.user?.id === authedUserId ? 'bg-accent ms-20 me-10' : ' ms-10 me-20'
                    )}
                  >
                    <div className="space-y-3">
                      {/* Comment header */}

                      {/** <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(comment)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this comment? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>**/}

                      {/* Comment content */}

                      <>
                        {/*  <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              className="min-h-[60px]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditContent('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(comment.id)}
                                disabled={!editContent.trim() || editCommentMutation.isPending}
                              >
                                {editCommentMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div> */}
                      </>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-end gap-2 text-xs text-muted-foreground">
                      <div className="flex items-end">
                        {comment.updatedAt !== comment.createdAt && <span>Edited</span>}
                      </div>
                      <div className="flex items-end justify-end gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                        <User className="w-4 h-4" />
                        <span className="font-medium">{formatUserName(comment.user)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
          {/* Add new comment */}
          <div className="relative">
            <InputGroup>
              <InputGroupTextarea
                placeholder="Write your comment here..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <InputGroupAddon align="block-end" className="flex justify-end">
                <InputGroupButton
                  variant="default"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </>
      )}
    </div>
  );
};

export default Comments;

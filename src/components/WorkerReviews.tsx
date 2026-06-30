import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Divider,
  Avatar, CircularProgress, Alert, MenuItem, Paper, IconButton,
} from '@mui/material';
import { RateReview, Edit, Delete, Check, Close } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  appointment_id: number;
  client: { id: number; first_name: string; last_name: string };
}

interface PastAppointment {
  id: number;
  date: string;
}

interface Props {
  supportWorkerId: number;
  onRatingChange: (avg: number | null, count: number) => void;
}

const recalc = (list: Review[]) => {
  if (list.length === 0) return { avg: null, count: 0 };
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return { avg: Math.round(avg * 10) / 10, count: list.length };
};

const ReviewCard = ({
  review, isOwn, onSave, onDelete,
}: {
  review: Review;
  isOwn: boolean;
  onSave: (id: number, rating: number, comment: string) => Promise<void>;
  onDelete: (id: number) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const initials = `${review.client.first_name.charAt(0)}${review.client.last_name.charAt(0)}`;
  const date = new Date(review.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleSave = async () => {
    setSaving(true);
    await onSave(review.id, editRating, editComment);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditRating(review.rating);
    setEditComment(review.comment ?? '');
    setEditing(false);
  };

  return (
    <Box sx={{ py: 2.5 }}>
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#7B2FBE', fontSize: 14 }}>{initials}</Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {review.client.first_name} {review.client.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">{date}</Typography>
        </Box>
        <Box ml="auto" display="flex" alignItems="center" gap={0.5}>
          {!editing && <StarRating value={review.rating} readOnly size="small" />}
          {isOwn && !editing && (
            <>
              <IconButton size="small" onClick={() => setEditing(true)} sx={{ color: '#7B2FBE' }}>
                <Edit fontSize="small" />
              </IconButton>
              {confirming ? (
                <>
                  <Typography variant="caption" color="error" sx={{ mx: 0.5 }}>Delete?</Typography>
                  <IconButton size="small" color="error" onClick={() => onDelete(review.id)}><Check fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setConfirming(false)}><Close fontSize="small" /></IconButton>
                </>
              ) : (
                <IconButton size="small" color="error" onClick={() => setConfirming(true)}>
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </>
          )}
        </Box>
      </Box>

      {editing ? (
        <Box sx={{ pl: '52px' }} display="flex" flexDirection="column" gap={1.5}>
          <StarRating value={editRating} onChange={setEditRating} size="medium" />
          <TextField
            multiline
            minRows={2}
            fullWidth
            size="small"
            value={editComment}
            onChange={e => setEditComment(e.target.value)}
            placeholder="Update your comment…"
          />
          <Box display="flex" gap={1}>
            <Button size="small" variant="contained" onClick={handleSave} disabled={saving || !editRating}
              sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="small" variant="outlined" onClick={handleCancel} disabled={saving}>Cancel</Button>
          </Box>
        </Box>
      ) : (
        review.comment && (
          <Typography variant="body2" color="text.secondary" sx={{ pl: '52px' }}>
            {review.comment}
          </Typography>
        )
      )}
    </Box>
  );
};

const WorkerReviews = ({ supportWorkerId, onRatingChange }: Props) => {
  const { client } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastAppointments, setPastAppointments] = useState<PastAppointment[]>([]);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reviewedAppointmentIds = new Set(reviews.map(r => r.appointment_id));

  const updateReviews = (next: Review[]) => {
    setReviews(next);
    const { avg, count } = recalc(next);
    onRatingChange(avg, count);
  };

  useEffect(() => {
    axiosInstance.get(`/support_workers/${supportWorkerId}/reviews`)
      .then(r => {
        setReviews(r.data);
        const { avg, count } = recalc(r.data);
        onRatingChange(avg, count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (client) {
      axiosInstance.get('/appointments').then(r => {
        const now = new Date();
        const eligible = r.data.filter(
          (a: any) => a.support_worker?.id === supportWorkerId &&
            a.status === 'approved' &&
            new Date(a.date) < now
        );
        setPastAppointments(eligible);
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supportWorkerId, client]);

  const handleSubmit = async () => {
    if (!rating || !selectedAppointmentId) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data } = await axiosInstance.post('/reviews', {
        appointment_id: selectedAppointmentId,
        rating,
        comment: comment.trim() || null,
      });
      updateReviews([data, ...reviews]);
      setRating(0);
      setComment('');
      setSelectedAppointmentId('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e: any) {
      setSubmitError(e.response?.data?.errors?.join(', ') || 'Could not submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: number, newRating: number, newComment: string) => {
    const { data } = await axiosInstance.patch(`/reviews/${id}`, {
      rating: newRating,
      comment: newComment.trim() || null,
    });
    updateReviews(reviews.map(r => r.id === id ? data : r));
  };

  const handleDelete = async (id: number) => {
    await axiosInstance.delete(`/reviews/${id}`);
    updateReviews(reviews.filter(r => r.id !== id));
  };

  const hasUnreviewedPastAppts = pastAppointments.some(a => !reviewedAppointmentIds.has(a.id));

  if (loading) return <Box display="flex" justifyContent="center" pt={4}><CircularProgress size={28} sx={{ color: '#7B2FBE' }} /></Box>;

  return (
    <Box>
      {client && pastAppointments.length > 0 && hasUnreviewedPastAppts && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <RateReview sx={{ color: '#7B2FBE', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={600}>Leave a review</Typography>
          </Box>

          {submitted && <Alert severity="success" sx={{ mb: 2 }}>Review submitted — thank you!</Alert>}
          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              select
              label="Which appointment?"
              value={selectedAppointmentId}
              onChange={e => {
                if (!reviewedAppointmentIds.has(Number(e.target.value))) {
                  setSelectedAppointmentId(e.target.value);
                }
              }}
              size="small"
              fullWidth
            >
              {pastAppointments.map(a => {
                const alreadyReviewed = reviewedAppointmentIds.has(a.id);
                const label = new Date(a.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                return (
                  <MenuItem key={a.id} value={a.id} disabled={alreadyReviewed}
                    sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, opacity: alreadyReviewed ? 0.6 : 1 }}>
                    <span>{label}</span>
                    {alreadyReviewed && (
                      <Typography variant="caption" color="text.secondary" component="span">Already reviewed</Typography>
                    )}
                  </MenuItem>
                );
              })}
            </TextField>

            <Box>
              <Typography variant="body2" color="text.secondary" mb={0.75}>Your rating</Typography>
              <StarRating value={rating} onChange={setRating} size="large" />
            </Box>

            <TextField
              label="Comment (optional)"
              multiline
              minRows={3}
              fullWidth
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience working with this support worker…"
            />

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!rating || !selectedAppointmentId || submitting}
              sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' }, alignSelf: 'flex-start' }}
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </Button>
          </Box>
        </Paper>
      )}

      {reviews.length === 0 ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No reviews yet.
        </Typography>
      ) : (
        <Box>
          {reviews.map((review, i) => (
            <Box key={review.id}>
              <ReviewCard
                review={review}
                isOwn={client?.id === review.client.id}
                onSave={handleSaveEdit}
                onDelete={handleDelete}
              />
              {i < reviews.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default WorkerReviews;

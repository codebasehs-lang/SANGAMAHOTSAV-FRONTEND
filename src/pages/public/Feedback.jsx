import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, CheckCircle2 } from 'lucide-react';

import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobileNumber: z
    .string()
    .regex(/^[0-9]{10,15}$/, 'Enter a valid 10-15 digit number'),
  overallRating: z.coerce.number().min(1, 'Please select a rating').max(5),
  suggestions: z.string().optional(),
});

export default function Feedback() {
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { overallRating: 0 },
  });

  function selectRating(value) {
    setRating(value);
    setValue('overallRating', value, { shouldValidate: true });
  }

  async function onSubmit(values) {
    setServerError('');
    try {
      await api.post('/feedbacks', values);
      setSubmitted(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  if (submitted) {
    return (
      <div className="container max-w-xl py-16">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback has been submitted. Hare Krishna!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Seminar Feedback</CardTitle>
          <CardDescription>
            We would love to hear about your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Name <span className="text-destructive">*</span>
              </Label>
              <Input {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Mobile Number <span className="text-destructive">*</span>
              </Label>
              <Input {...register('mobileNumber')} />
              {errors.mobileNumber && (
                <p className="text-xs text-destructive">
                  {errors.mobileNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Overall Experience <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => selectRating(v)}
                    aria-label={`${v} star`}
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        v <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  </button>
                ))}
              </div>
              {errors.overallRating && (
                <p className="text-xs text-destructive">
                  {errors.overallRating.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Suggestions</Label>
              <Textarea rows={4} {...register('suggestions')} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

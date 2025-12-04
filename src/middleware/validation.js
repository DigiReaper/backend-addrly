import Joi from 'joi';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(d => ({
          message: d.message,
          field: d.path.join('.')
        }))
      });
    }

    req.body = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  createDateMeDoc: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(5000).allow('', null),
    header_content: Joi.string().max(10000).allow('', null),
    slug: Joi.string().min(3).max(100).pattern(/^[a-z0-9-]+$/).required(),
    preferences: Joi.object().default({}),
    form_questions: Joi.array().items(
      Joi.object({
        id: Joi.string().uuid().required(),
        question: Joi.string().required(),
        type: Joi.string().valid('text', 'textarea', 'url', 'video', 'email', 'select').required(),
        required: Joi.boolean().default(false),
        options: Joi.array().items(Joi.string()).when('type', {
          is: 'select',
          then: Joi.required()
        }),
        order: Joi.number().integer().min(0).required()
      })
    ).default([]),
    is_public: Joi.boolean().default(true),
    settings: Joi.object().default({})
  }),

  updateDateMeDoc: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(5000).allow('', null),
    header_content: Joi.string().max(10000).allow('', null),
    preferences: Joi.object(),
    form_questions: Joi.array().items(
      Joi.object({
        id: Joi.string().uuid().required(),
        question: Joi.string().required(),
        type: Joi.string().valid('text', 'textarea', 'url', 'video', 'email', 'select').required(),
        required: Joi.boolean().default(false),
        options: Joi.array().items(Joi.string()),
        order: Joi.number().integer().min(0).required()
      })
    ),
    is_active: Joi.boolean(),
    is_public: Joi.boolean(),
    settings: Joi.object()
  }),

  submitApplication: Joi.object({
    applicant_email: Joi.string().email().required(),
    applicant_name: Joi.string().min(2).max(100).required(),
    answers: Joi.object().required(),
    submitted_links: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('twitter', 'instagram', 'website', 'blog', 'linkedin', 'spotify', 'other').required(),
        url: Joi.string().uri().required(),
        handle: Joi.string().allow('', null)
      })
    ).min(1).required()
  }),

  updateUserProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    bio: Joi.string().max(1000).allow('', null),
    twitter_handle: Joi.string().max(50).allow('', null),
    instagram_handle: Joi.string().max(50).allow('', null),
    personal_website: Joi.string().uri().allow('', null),
    spotify_profile: Joi.string().uri().allow('', null),
    other_links: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        url: Joi.string().uri().required()
      })
    )
  })
};

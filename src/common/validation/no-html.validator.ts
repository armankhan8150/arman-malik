import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function NoHtml(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'noHtml',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          return !/<[^>]*>/u.test(value);
        },

        defaultMessage(
          args: ValidationArguments,
        ): string {
          return `${args.property} must not contain HTML markup`;
        },
      },
    });
  };
}
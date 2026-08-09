export class UserResponseDto {
  id: string;
  name: string | null;
  email: string;
  lastLoggedIn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

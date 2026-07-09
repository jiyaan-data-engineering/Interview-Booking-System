interface AlertProps {
  message: string;
  type: 'success' | 'error';
}

export default function Alert({ message, type }: AlertProps) {
  const isSuccess = type === 'success';

  return (
    <div
      className={`rounded-lg p-4 mb-4 border-l-4 ${
        isSuccess
          ? 'bg-green-900/20 border-green-500 text-green-300'
          : 'bg-red-900/20 border-red-500 text-red-300'
      }`}
    >
      <div className="flex items-center">
        <span className="mr-3 text-xl">{isSuccess ? '✓' : '✗'}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

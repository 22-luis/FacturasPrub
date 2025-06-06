
import { ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

async function getTodos(): Promise<Todo[]> {
  try {
    // Fetching only 10 todos for this example
    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=10');
    if (!response.ok) {
      // Log the error and throw it to be potentially caught by an error boundary
      console.error(`Failed to fetch todos. Status: ${response.status}`);
      throw new Error(`Failed to fetch todos. Status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error in getTodos:", error);
    // In a real application, you would typically let an error.js file handle this
    // or return a more specific error object to the component.
    // For this example, we'll re-throw to simulate a scenario where an error boundary would catch it.
    // If no error.js is present at this route segment, Next.js will show its default error page.
    throw error; 
  }
}

export default async function ExternalDataPage() {
  let todos: Todo[] = [];
  let fetchError: string | null = null;

  try {
    todos = await getTodos();
  } catch (error) {
    if (error instanceof Error) {
      fetchError = error.message;
    } else {
      fetchError = "An unknown error occurred while fetching todos.";
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground flex items-center">
          <ListChecks className="mr-3 h-8 w-8 text-primary" />
          External API Data: Todos
        </h1>
        <p className="text-muted-foreground mt-1">
          This page demonstrates fetching data from an external API (JSONPlaceholder).
        </p>
      </header>

      {fetchError && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground p-4">
          <CardHeader>
            <CardTitle className="text-lg">Error Fetching Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{fetchError}</p>
            <p className="mt-2 text-sm">Please check the console for more details or try again later.</p>
          </CardContent>
        </Card>
      )}

      {!fetchError && todos.length === 0 && (
        <p className="text-muted-foreground text-center py-10">
          No todos were fetched. This might be due to an API issue or an empty list.
        </p>
      )}

      {!fetchError && todos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {todos.map((todo) => (
            <Card key={todo.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg truncate" title={todo.title}>
                  Todo #{todo.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-base mb-3 min-h-[40px]">{todo.title}</p>
                <Badge variant={todo.completed ? 'default' : 'outline'}>
                  {todo.completed ? 'Completed' : 'Pending'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

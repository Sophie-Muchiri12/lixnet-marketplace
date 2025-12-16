<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

// Override the default request binding BEFORE app creation
$baseDir = dirname(__DIR__);

// Create application with manual configuration
$app = new Application($baseDir);

// Bind a request early to prevent UrlGenerator from failing
$app->singleton('request', function ($app) {
    return \Illuminate\Http\Request::capture();
});

// Now configure routing, middleware, etc.
$app = Application::configure(basePath: $baseDir);

$app->withRouting(
    web: $baseDir.'/routes/web.php',
    api: $baseDir.'/routes/api.php',
    commands: $baseDir.'/routes/console.php',
    health: '/up'
);

$app->withMiddleware(function (Middleware $middleware) {
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

    $middleware->web(append: [
        HandleAppearance::class,
        HandleInertiaRequests::class,
        AddLinkHeadersForPreloadedAssets::class,
    ]);

    $middleware->alias([
        'admin' => \App\Http\Middleware\CheckAdminRole::class,
        'agent' => \App\Http\Middleware\CheckAgentRole::class,
        'customer' => \App\Http\Middleware\CheckCustomerRole::class,
    ]);
});

$app->withExceptions(function (Exceptions $exceptions) {
    //
});

$createdApp = $app->create();

// Ensure request is bound for CLI
if (!$createdApp->has('request')) {
    $createdApp->singleton('request', function () {
        return \Illuminate\Http\Request::capture();
    });
}

return $createdApp;
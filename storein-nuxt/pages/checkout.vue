<template>
  <div class="container-main py-8 min-h-[70vh]">

    <!-- -- Stepper ----------------------------------------------- -->
    <div class="flex items-center justify-center gap-0 mb-10 select-none">
      <template v-for="(s, i) in steps" :key="s.key">
        <!-- Step circle -->
        <div class="flex flex-col items-center gap-1.5">
          <div :class="[
            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
            currentStep > i
              ? 'bg-brand text-white'
              : currentStep === i
                ? 'bg-brand text-white ring-4 ring-brand/20'
                : 'bg-surface-border text-text-disabled',
          ]">
            <svg v-if="currentStep > i" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span :class="[
            'text-xs font-medium whitespace-nowrap',
            currentStep >= i ? 'text-text-primary' : 'text-text-disabled',
          ]">{{ s.label }}</span>
        </div>
        <!-- Connector -->
        <div v-if="i < steps.length - 1"
             :class="['h-0.5 w-16 sm:w-24 mx-1 mb-5 transition-all duration-300', currentStep > i ? 'bg-brand' : 'bg-surface-border']" />
      </template>
    </div>

    <!-- Empty cart guard -->
    <div v-if="!cartStore.items.length && !placing"
         class="text-center py-20">
      <div class="text-5xl mb-4">??</div>
      <p class="text-text-secondary mb-4">??? ???? ??? ???? ???</p>
      <NuxtLink :to="{ name: 'products' }" class="btn-brand px-6 py-2.5 text-sm">
        ?????? ???????
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      <!-- -- Main content --------------------------------------- -->
      <div class="lg:col-span-2 space-y-5">

        <!-- -- STEP 0: ???? ????? ------------------------------ -->
        <div v-show="currentStep === 0">
          <div class="rounded-2xl border border-surface-border p-5 space-y-4"
               style="background-color: var(--color-card)">
            <h2 class="font-bold text-text-primary text-base flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center">?</span>
              ???? ?????
            </h2>

            <!-- Loading -->
            <div v-if="loadingAddresses" class="space-y-3">
              <div v-for="i in 2" :key="i" class="h-24 rounded-xl skeleton" />
            </div>

            <!-- Address list -->
            <div v-else-if="addresses.length" class="space-y-3">
              <div
                v-for="addr in addresses" :key="addr._id"
                @click="selectedAddressId = addr._id"
                :class="[
                  'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedAddressId === addr._id
                    ? 'border-brand bg-brand/5'
                    : 'border-surface-border hover:border-brand/40',
                ]"
              >
                <!-- Radio dot -->
                <div :class="[
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                  selectedAddressId === addr._id ? 'border-brand' : 'border-surface-border',
                ]">
                  <div v-if="selectedAddressId === addr._id" class="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
                <!-- Address info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-text-primary text-sm">{{ addr.title }}</span>
                    <span v-if="addr.isDefault" class="text-[11px] bg-brand/10 text-brand px-2 py-0.5 rounded-full">???????</span>
                  </div>
                  <p class="text-text-primary text-sm mt-1">{{ addr.recipientName }}</p>
                  <p class="text-text-secondary text-xs mt-0.5 leading-5">
                    {{ addr.province }}? {{ addr.city }}? {{ addr.street }}? {{ addr.detail }}
                  </p>
                  <p class="text-text-disabled text-xs font-fanum mt-0.5">{{ addr.recipientPhone }} · ?? ????: {{ addr.postalCode }}</p>
                </div>
              </div>

              <!-- Add new address link -->
              <button
                @click="showAddressForm = !showAddressForm"
                class="w-full py-3 rounded-xl border-2 border-dashed border-surface-border text-sm text-text-secondary hover:border-brand/40 hover:text-brand transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M12 4v16m8-8H4"/>
                </svg>
                {{ showAddressForm ? '???? ???' : '?????? ???? ????' }}
              </button>
            </div>

            <!-- No addresses -->
            <div v-else-if="!loadingAddresses && !showAddressForm"
                 class="py-6 text-center">
              <p class="text-text-secondary text-sm mb-3">????? ??? ???? ???</p>
              <button @click="showAddressForm = true" class="btn-brand text-sm px-4 py-2">
                ?????? ????
              </button>
            </div>

            <!-- Inline address form -->
            <Transition name="expand">
              <div v-if="showAddressForm" class="border-t border-surface-border pt-4 space-y-4">
                <h3 class="text-sm font-bold text-text-primary">???? ????</h3>

                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <label class="form-label">????? <span class="text-error">*</span></label>
                    <input v-model="addrForm.title" class="form-input" placeholder="????? ??? ???..." maxlength="30" />
                    <p v-if="addrErrors.title" class="text-error text-xs">{{ addrErrors.title }}</p>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="form-label">??? ?????? <span class="text-error">*</span></label>
                    <input v-model="addrForm.recipientName" class="form-input" placeholder="??? ? ??? ????????" />
                    <p v-if="addrErrors.recipientName" class="text-error text-xs">{{ addrErrors.recipientName }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <label class="form-label">???? ?????? <span class="text-error">*</span></label>
                    <input v-model="addrForm.recipientPhone" class="form-input font-fanum" dir="ltr" placeholder="09xxxxxxxxx" />
                    <p v-if="addrErrors.recipientPhone" class="text-error text-xs">{{ addrErrors.recipientPhone }}</p>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="form-label">?? ???? <span class="text-error">*</span></label>
                    <input v-model="addrForm.postalCode" class="form-input font-fanum" dir="ltr" placeholder="1234567890" maxlength="10" />
                    <p v-if="addrErrors.postalCode" class="text-error text-xs">{{ addrErrors.postalCode }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <label class="form-label">????? <span class="text-error">*</span></label>
                    <input v-model="addrForm.province" class="form-input" placeholder="?????" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="form-label">??? <span class="text-error">*</span></label>
                    <input v-model="addrForm.city" class="form-input" placeholder="?????" />
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="form-label">?????? / ???? <span class="text-error">*</span></label>
                  <input v-model="addrForm.street" class="form-input" placeholder="?????? ??????? ???? ????" />
                </div>

                <div class="flex flex-col gap-1">
                  <label class="form-label">?????? (????? ????? ????) <span class="text-error">*</span></label>
                  <textarea v-model="addrForm.detail" class="form-input resize-none" rows="2" placeholder="???? ??? ???? ?? ???? ?" />
                </div>

                <button
                  @click="saveNewAddress"
                  :disabled="savingAddress"
                  class="btn-brand text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg v-if="savingAddress" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  {{ savingAddress ? '?? ??? ?????...' : '????? ????' }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="flex justify-end mt-4">
            <button
              @click="goToStep(1)"
              :disabled="!selectedAddressId"
              class="btn-brand px-8 py-3 flex items-center gap-2 disabled:opacity-40"
            >
              ????? — ????? ?????
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- -- STEP 1: ????? ????? ------------------------------ -->
        <div v-show="currentStep === 1">
          <div class="rounded-2xl border border-surface-border p-5 space-y-4"
               style="background-color: var(--color-card)">
            <h2 class="font-bold text-text-primary text-base flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center">?</span>
              ????? ?????
            </h2>

            <!-- Cart items (compact) -->
            <div class="space-y-3">
              <div
                v-for="item in cartStore.items" :key="`${item.productId}-${item.variantId}`"
                class="flex items-center gap-3 py-3 border-b border-surface-border last:border-0"
              >
                <img
                  :src="item.thumbnail || PLACEHOLDER"
                  :alt="item.name"
                  class="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                  @error="e => e.target.src = PLACEHOLDER"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-text-primary text-sm font-medium line-clamp-1">{{ item.name }}</p>
                  <div v-if="item.attributes?.length" class="flex gap-1 mt-1 flex-wrap">
                    <span
                      v-for="a in item.attributes" :key="a.key"
                      class="text-[11px] text-text-disabled bg-surface px-1.5 py-0.5 rounded"
                    >{{ a.key }}: {{ a.value }}</span>
                  </div>
                </div>
                <div class="text-left flex-shrink-0 text-sm">
                  <p class="font-fanum text-text-secondary">× {{ formatNumber(item.quantity) }}</p>
                  <p class="font-fanum font-bold text-text-primary mt-0.5">{{ formatPrice(item.price * item.quantity) }}</p>
                </div>
              </div>
            </div>

            <!-- Coupon code -->
            <div class="space-y-2">
              <label class="form-label">?? ?????</label>
              <div class="flex gap-2">
                <input
                  v-model="couponCode"
                  class="form-input flex-1 uppercase tracking-widest"
                  dir="ltr"
                  placeholder="?? ????? (???????)"
                  :disabled="couponApplied || checkingCoupon"
                  @keydown.enter="applyCoupon"
                  @input="couponMessage = ''; couponError = false"
                />
                <button
                  v-if="!couponApplied"
                  @click="applyCoupon"
                  :disabled="!couponCode.trim() || checkingCoupon"
                  class="px-4 py-2.5 rounded-xl border border-brand text-brand text-sm font-medium hover:bg-brand hover:text-white transition-colors disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
                >
                  <svg v-if="checkingCoupon" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  {{ checkingCoupon ? '?????...' : '?????' }}
                </button>
                <button
                  v-else
                  @click="removeCoupon"
                  class="px-4 py-2.5 rounded-xl border border-error text-error text-sm font-medium hover:bg-error hover:text-white transition-colors"
                >
                  ???
                </button>
              </div>
              <p v-if="couponMessage" :class="['text-xs font-medium flex items-center gap-1', couponError ? 'text-error' : 'text-success']">
                <span v-if="couponError">?</span>
                {{ couponMessage }}
              </p>
            </div>

            <!-- Note -->
            <div class="space-y-2">
              <label class="form-label">??????? ???? ????? (???????)</label>
              <textarea
                v-model="orderNote"
                class="form-input resize-none"
                rows="2"
                placeholder="??? ????? ???? ???? ????? ????? ???????..."
                maxlength="300"
              />
              <p class="text-xs text-text-disabled font-fanum text-left">{{ orderNote.length }}/???</p>
            </div>
          </div>

          <div class="flex justify-between mt-4">
            <button @click="goToStep(0)" class="px-5 py-2.5 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
              </svg>
              ??????
            </button>
            <button @click="goToStep(2)" class="btn-brand px-8 py-3 flex items-center gap-2">
              ????? — ??????
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- -- STEP 2: ??? ?????? ------------------------------- -->
        <div v-show="currentStep === 2">
          <div class="rounded-2xl border border-surface-border p-5 space-y-5"
               style="background-color: var(--color-card)">
            <h2 class="font-bold text-text-primary text-base flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center">?</span>
              ??? ??????
            </h2>

            <!-- Wallet balance banner -->
            <div class="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
              <div class="flex items-center gap-2 text-sm text-text-secondary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                  <path stroke-linecap="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                ?????? ??? ???
              </div>
              <span class="font-fanum font-bold text-text-primary">
                {{ loadingWallet ? '...' : formatPrice(walletBalance) }}
              </span>
            </div>

            <!-- Payment method options -->
            <div class="space-y-3">

              <!-- Gateway only -->
              <label :class="[
                'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                paymentMethod === 'gateway' ? 'border-brand bg-brand/5' : 'border-surface-border hover:border-brand/30',
              ]">
                <input type="radio" value="gateway" v-model="paymentMethod" class="sr-only" />
                <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center', paymentMethod === 'gateway' ? 'border-brand' : 'border-surface-border']">
                  <div v-if="paymentMethod === 'gateway'" class="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
                <div>
                  <p class="font-semibold text-text-primary text-sm">?????? ?????? (????? ?????)</p>
                  <p class="text-text-secondary text-xs mt-0.5">?????? ???? ?? ???? ????? ????? ???</p>
                </div>
                <div class="mr-auto flex gap-1.5 items-center flex-shrink-0">
                  <div v-for="b in ['??','??']" :key="b" class="text-lg">{{ b }}</div>
                </div>
              </label>

              <!-- Wallet only (if sufficient) -->
              <label :class="[
                'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                walletBalance < cartStore.totalPrice
                  ? 'border-surface-border opacity-50 cursor-not-allowed'
                  : paymentMethod === 'wallet' ? 'border-brand bg-brand/5' : 'border-surface-border hover:border-brand/30',
              ]">
                <input
                  type="radio" value="wallet" v-model="paymentMethod"
                  class="sr-only"
                  :disabled="walletBalance < cartStore.totalPrice"
                />
                <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center', paymentMethod === 'wallet' ? 'border-brand' : 'border-surface-border']">
                  <div v-if="paymentMethod === 'wallet'" class="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
                <div>
                  <p class="font-semibold text-text-primary text-sm">?????? ?? ??? ???</p>
                  <p class="text-text-secondary text-xs mt-0.5">
                    {{ walletBalance < cartStore.totalPrice
                        ? `?????? ???? ???? (?????: ${formatPrice(cartStore.totalPrice - walletBalance)})`
                        : '?????? ???? ???? ???? ?? ?????' }}
                  </p>
                </div>
                <span class="mr-auto text-xs font-fanum text-brand font-bold flex-shrink-0">{{ formatPrice(walletBalance) }}</span>
              </label>

              <!-- Mixed (wallet + gateway) — only if wallet has some balance but not enough -->
              <label v-if="walletBalance > 0 && walletBalance < cartStore.totalPrice" :class="[
                'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                paymentMethod === 'mixed' ? 'border-brand bg-brand/5' : 'border-surface-border hover:border-brand/30',
              ]">
                <input type="radio" value="mixed" v-model="paymentMethod" class="sr-only" />
                <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center', paymentMethod === 'mixed' ? 'border-brand' : 'border-surface-border']">
                  <div v-if="paymentMethod === 'mixed'" class="w-2.5 h-2.5 rounded-full bg-brand" />
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-text-primary text-sm">?????? (??? ??? + ?????)</p>
                  <p class="text-text-secondary text-xs mt-0.5">???? ?? ??? ???? ????? ?? ?????</p>
                  <Transition name="expand">
                    <div v-if="paymentMethod === 'mixed'" class="mt-3 space-y-2">
                      <label class="form-label text-xs">???? ?? ??? ??? (?????)</label>
                      <div class="flex items-center gap-3">
                        <input
                          type="range"
                          v-model.number="walletAmount"
                          :min="1"
                          :max="walletBalance"
                          :step="1000"
                          class="flex-1 accent-brand"
                        />
                        <span class="font-fanum text-sm text-brand font-bold w-28 text-left">{{ formatPrice(walletAmount) }}</span>
                      </div>
                      <p class="text-xs text-text-secondary font-fanum">
                        ????? ?? ?????: {{ formatPrice(cartStore.totalPrice - walletAmount) }}
                      </p>
                    </div>
                  </Transition>
                </div>
              </label>

            </div>
          </div>

          <!-- Place order button -->
          <div class="flex justify-between mt-4">
            <button @click="goToStep(1)" class="px-5 py-2.5 rounded-xl border border-surface-border text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M15 19l-7-7 7-7"/>
              </svg>
              ??????
            </button>
            <button
              @click="placeOrder"
              :disabled="placing"
              class="btn-brand px-8 py-3 flex items-center gap-2 disabled:opacity-50"
            >
              <svg v-if="placing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              {{ placing ? '?? ??? ??????...' : '????? ? ??????' }}
            </button>
          </div>
        </div>

      </div>

      <!-- -- Sticky order summary -------------------------------- -->
      <div class="rounded-2xl border border-surface-border p-5 flex flex-col gap-4 lg:sticky lg:top-24"
           style="background-color: var(--color-card)">
        <h2 class="font-bold text-text-primary text-sm border-b border-surface-border pb-3">
          ????? ??? ????
        </h2>

        <!-- Items mini list -->
        <div class="space-y-2 max-h-52 overflow-y-auto">
          <div
            v-for="item in cartStore.items" :key="`${item.productId}-${item.variantId}`"
            class="flex items-center gap-2"
          >
            <img :src="item.thumbnail || PLACEHOLDER" :alt="item.name"
                 class="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                 @error="e => e.target.src = PLACEHOLDER" />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-text-primary line-clamp-1">{{ item.name }}</p>
              <p class="text-xs text-text-disabled font-fanum">× {{ formatNumber(item.quantity) }}</p>
            </div>
            <span class="text-xs font-fanum font-medium text-text-primary flex-shrink-0">
              {{ formatPrice(item.price * item.quantity) }}
            </span>
          </div>
        </div>

        <!-- Totals -->
        <div class="space-y-2 text-sm border-t border-surface-border pt-3">
          <div class="flex justify-between text-text-secondary">
            <span>??? ??????</span>
            <span class="font-fanum">{{ formatPrice(subtotal) }}</span>
          </div>
          <div v-if="savings > 0" class="flex justify-between text-success">
            <span>?????</span>
            <span class="font-fanum">- {{ formatPrice(savings) }}</span>
          </div>
          <div v-if="couponApplied" class="flex justify-between text-success text-xs">
            <span>?? ????? «{{ couponCode }}»</span>
            <span class="font-fanum">????? ?? ?</span>
          </div>
          <div class="flex justify-between text-text-secondary">
            <span>????? ?????</span>
            <span class="text-success font-medium">??????</span>
          </div>
        </div>

        <div class="border-t border-surface-border pt-3">
          <div class="flex justify-between items-center">
            <span class="font-bold text-text-primary">???? ???? ??????</span>
            <span class="text-brand text-lg font-black font-fanum">{{ formatPrice(cartStore.totalPrice) }}</span>
          </div>
          <p v-if="savings > 0" class="text-success text-xs font-fanum text-left mt-1">
            {{ formatPrice(savings) }} ?????????
          </p>
        </div>

        <!-- Selected address summary -->
        <div v-if="selectedAddress && currentStep > 0"
             class="border-t border-surface-border pt-3 text-xs text-text-secondary space-y-0.5">
          <p class="font-semibold text-text-primary">?? ???? ?????:</p>
          <p>{{ selectedAddress.recipientName }}</p>
          <p>{{ selectedAddress.city }}? {{ selectedAddress.street }}</p>
        </div>

        <!-- Trust badges -->
        <div class="border-t border-surface-border pt-3 grid grid-cols-2 gap-2">
          <div v-for="t in trustBadges" :key="t.icon" class="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span>{{ t.icon }}</span>
            <span>{{ t.label }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>

definePageMeta({ layout: 'default', middleware: ['auth'] })


import { ref, computed, onMounted, watch } from 'vue'
import { useRouter }       from 'vue-router'
import { useCartStore }    from '~/stores/cart.store'
import { useAuthStore }    from '~/stores/auth.store'
import { useUiStore }      from '~/stores/ui.store'
import { userService }     from '~/services/user.service'
import { orderService }    from '~/services/order.service'
import { paymentService }  from '~/services/payment.service'
import { discountService } from '~/services/discount.service'
import { formatPrice, formatNumber } from '~/utils/formatters'

const router    = useRouter()
const cartStore = useCartStore()
const auth      = useAuthStore()
const ui        = useUiStore()

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="%23e2e8f0"%3E%3Crect width="56" height="56"/%3E%3C/svg%3E'

// -- Steps ------------------------------------------------------
const steps = [
  { key: 'address', label: '????' },
  { key: 'review',  label: '?????' },
  { key: 'payment', label: '??????' },
]
const currentStep = ref(0)

function goToStep(n) {
  currentStep.value = n
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// -- Addresses --------------------------------------------------
const addresses         = ref([])
const loadingAddresses  = ref(true)
const selectedAddressId = ref(null)
const showAddressForm   = ref(false)
const savingAddress     = ref(false)

const selectedAddress = computed(() =>
  addresses.value.find(a => a._id === selectedAddressId.value) ?? null
)

const addrForm = ref({
  title: '', recipientName: '', recipientPhone: '',
  postalCode: '', province: '', city: '', street: '', detail: '',
})
const addrErrors = ref({})

async function fetchAddresses() {
  loadingAddresses.value = true
  try {
    const { data } = await userService.getProfile()
    addresses.value = data.addresses ?? []
    const def = addresses.value.find(a => a.isDefault) ?? addresses.value[0]
    if (def) selectedAddressId.value = def._id
    if (!addresses.value.length) showAddressForm.value = true
  } catch {
    ui.addToast('??? ?? ?????? ???????', 'error')
  } finally {
    loadingAddresses.value = false
  }
}

function validateAddrForm() {
  const e = {}
  if (!addrForm.value.title.trim())         e.title = '?????? ???'
  if (!addrForm.value.recipientName.trim()) e.recipientName = '?????? ???'
  if (!/^0?9\d{9}$/.test(addrForm.value.recipientPhone))
    e.recipientPhone = '????? ????? ????'
  if (!/^\d{10}$/.test(addrForm.value.postalCode))
    e.postalCode = '???? ?? ??? ????'
  addrErrors.value = e
  return !Object.keys(e).length
}

async function saveNewAddress() {
  if (!validateAddrForm()) return
  savingAddress.value = true
  try {
    const { data } = await userService.addAddress(addrForm.value)
    addresses.value = data.addresses ?? []
    auth.user = data
    const newest = addresses.value[addresses.value.length - 1]
    if (newest) selectedAddressId.value = newest._id
    showAddressForm.value = false
    addrForm.value = { title: '', recipientName: '', recipientPhone: '', postalCode: '', province: '', city: '', street: '', detail: '' }
    ui.addToast('???? ????? ??', 'success')
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? '??? ?? ????? ????'), 'error')
  } finally {
    savingAddress.value = false
  }
}

// -- Coupon ------------------------------------------------------
const couponCode     = ref('')
const couponApplied  = ref(false)
const couponMessage  = ref('')
const couponError    = ref(false)
const checkingCoupon = ref(false)
const discountAmount = ref(0)

async function applyCoupon() {
  const code = couponCode.value.trim().toUpperCase()
  if (!code) return

  checkingCoupon.value = true
  couponMessage.value  = ''
  couponError.value    = false

  try {
    const { data } = await discountService.validate(code, cartStore.totalPrice)

    if (data.isValid) {
      couponApplied.value  = true
      couponError.value    = false
      discountAmount.value = data.discountAmount ?? 0
      couponMessage.value  = data.discountAmount
        ? `${formatPrice(data.discountAmount)} ????? ????? ?? ?`
        : '?? ????? ????? ?? ?'
    } else {
      couponApplied.value  = false
      couponError.value    = true
      discountAmount.value = 0
      couponMessage.value  = data.message || '?? ????? ???? ?????'
    }
  } catch (err) {
    couponApplied.value  = false
    couponError.value    = true
    discountAmount.value = 0
    const msg = err?.response?.data?.message
    couponMessage.value  = Array.isArray(msg) ? msg[0] : (msg || '?? ????? ????? ????')
  } finally {
    checkingCoupon.value = false
  }
}

function removeCoupon() {
  couponCode.value     = ''
  couponApplied.value  = false
  couponMessage.value  = ''
  couponError.value    = false
  discountAmount.value = 0
}

// -- Order note -------------------------------------------------
const orderNote = ref('')

// -- Wallet -----------------------------------------------------
const walletBalance  = ref(0)
const loadingWallet  = ref(false)
const paymentMethod  = ref('gateway')
const walletAmount   = ref(0)

watch(currentStep, async (n) => {
  if (n === 2 && walletBalance.value === 0 && !loadingWallet.value) {
    loadingWallet.value = true
    try {
      const { data } = await paymentService.getBalance()
      walletBalance.value = data.balance ?? 0
      walletAmount.value  = Math.min(walletBalance.value, cartStore.totalPrice - 1)
    } catch { /* silent */ } finally {
      loadingWallet.value = false
    }
  }
})

// -- Totals -----------------------------------------------------
const subtotal = computed(() =>
  cartStore.items.reduce((s, i) => {
    const base = i.comparePrice > i.price ? i.comparePrice : i.price
    return s + base * i.quantity
  }, 0)
)
const savings = computed(() => subtotal.value - cartStore.totalPrice)

// -- Place order ------------------------------------------------
const placing = ref(false)

async function placeOrder() {
  if (!selectedAddressId.value) { ui.addToast('???? ????? ?? ?????? ????', 'error'); return }
  placing.value = true

  try {
    // 1. Create order
    const orderDto = {
      addressId:  selectedAddressId.value,
      ...(orderNote.value.trim()   ? { note:       orderNote.value.trim() }   : {}),
      ...(couponApplied.value && couponCode.value ? { couponCode: couponCode.value.trim() } : {}),
    }
    const { data: order } = await orderService.createOrder(orderDto)

    // 2. Pay
    const payDto = {
      orderId:     order._id,
      method:      paymentMethod.value,
      callbackUrl: `${window.location.origin}/payment/result?orderId=${order._id}`,
      ...(paymentMethod.value === 'mixed' ? { walletAmount: walletAmount.value } : {}),
    }
    const { data: payment } = await paymentService.payOrder(payDto)

    if (payment.success) {
      // Wallet payment — success immediately
      await cartStore.fetchCart()
      router.push({ name: 'payment-result', query: { status: 'success', orderId: order._id } })
    } else if (payment.gatewayUrl) {
      // Gateway — redirect user
      window.location.href = payment.gatewayUrl
    }
  } catch (err) {
    const msg = err?.response?.data?.message
    ui.addToast(Array.isArray(msg) ? msg[0] : (msg ?? '??? ?? ??? ?????'), 'error')
  } finally {
    placing.value = false
  }
}

// -- Trust badges ------------------------------------------------
const trustBadges = [
  { icon: '??', label: '?????? ???' },
  { icon: '??', label: '????? ??????' },
  { icon: '?', label: '????? ????' },
  { icon: '??', label: '????? ??????' },
]

onMounted(async () => {
  await cartStore.fetchCart()
  await fetchAddresses()
})
</script>

<style scoped>
.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
}
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border, var(--color-surface-border));
  background-color: var(--color-bg, var(--color-surface));
  color: var(--color-text-primary);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}
.form-input:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand) 12%, transparent);
}

/* Expand transition for inline form */
.expand-enter-active, .expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to, .expand-leave-from {
  max-height: 600px;
  opacity: 1;
}
</style>

